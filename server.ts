import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Helper to get NEIS API key from request query/header or environment variable
function resolveNeisKey(req: Request): string {
  const queryKey = req.query.key as string | undefined;
  const headerKey = req.headers['x-neis-key'] as string | undefined;
  const envKey = process.env.NEIS_API_KEY || process.env.VITE_NEIS_API_KEY;
  return (queryKey && queryKey.trim()) || (headerKey && headerKey.trim()) || (envKey && envKey.trim()) || '';
}

// 1. School search proxy
app.get('/api/neis/school', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: '학교명을 입력해주세요.' });
    }

    const key = resolveNeisKey(req);
    const keyParam = key ? `&KEY=${encodeURIComponent(key)}` : '';
    const targetUrl = `https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=25&SCHUL_NM=${encodeURIComponent(query)}${keyParam}`;

    const upstreamRes = await fetch(targetUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        success: false,
        error: `NEIS API 응답 오류 (${upstreamRes.status})`
      });
    }

    const data = await upstreamRes.json();

    // Check if NEIS returned an error response
    if (data.RESULT) {
      const code = data.RESULT.CODE;
      const message = data.RESULT.MESSAGE;
      if (code === 'INFO-200') {
        // No data found
        return res.json({ success: true, schools: [], total: 0 });
      }
      return res.status(400).json({ success: false, error: message || '검색 결과를 가져올 수 없습니다.', code });
    }

    if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
      const rows = data.schoolInfo[1].row;
      const schools = rows.map((r: any) => ({
        officeCode: r.ATPT_OFCDC_SC_CODE,
        officeName: r.ATPT_OFCDC_SC_NM,
        schoolCode: r.SD_SCHUL_CODE,
        schoolName: r.SCHUL_NM,
        schoolKind: r.SCHUL_KND_SC_NM,
        locationName: r.LCTN_SC_NM,
        founderName: r.FOND_SC_NM,
        address: r.ORG_RDNMA || r.ORG_RDNMA,
        zipCode: r.ORG_RDNZP,
        homepage: r.HMPG_ADRES,
        tel: r.USER_TELNO,
      }));
      return res.json({ success: true, schools, total: schools.length });
    }

    return res.json({ success: true, schools: [], total: 0 });
  } catch (err: any) {
    console.error('School search error:', err);
    return res.status(500).json({ success: false, error: err.message || '학교 검색 중 오류가 발생했습니다.' });
  }
});

// 2. Meal service diet proxy
app.get('/api/neis/meal', async (req: Request, res: Response) => {
  try {
    const officeCode = req.query.officeCode as string;
    const schoolCode = req.query.schoolCode as string;
    const date = req.query.date as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    if (!officeCode || !schoolCode) {
      return res.status(400).json({ success: false, error: '교육청 코드와 학교 코드가 필요합니다.' });
    }

    const key = resolveNeisKey(req);
    const keyParam = key ? `&KEY=${encodeURIComponent(key)}` : '';

    let dateParam = '';
    if (fromDate && toDate) {
      dateParam = `&MLSV_FROM_YMD=${encodeURIComponent(fromDate)}&MLSV_TO_YMD=${encodeURIComponent(toDate)}`;
    } else if (date) {
      dateParam = `&MLSV_YMD=${encodeURIComponent(date)}`;
    } else {
      // Default to today
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      dateParam = `&MLSV_YMD=${yyyy}${mm}${dd}`;
    }

    const targetUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${encodeURIComponent(officeCode)}&SD_SCHUL_CODE=${encodeURIComponent(schoolCode)}${dateParam}${keyParam}`;

    const upstreamRes = await fetch(targetUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        success: false,
        error: `NEIS API 응답 오류 (${upstreamRes.status})`
      });
    }

    const data = await upstreamRes.json();

    if (data.RESULT) {
      const code = data.RESULT.CODE;
      const message = data.RESULT.MESSAGE;
      if (code === 'INFO-200') {
        // No meals found for this date
        return res.json({ success: true, meals: [], total: 0 });
      }
      return res.status(400).json({ success: false, error: message || '식단 정보를 가져올 수 없습니다.', code });
    }

    if (data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row) {
      const rows = data.mealServiceDietInfo[1].row;
      const meals = rows.map((r: any) => ({
        mealCode: r.MMEAL_SC_CODE, // 1: 조식, 2: 중식, 3: 석식
        mealName: r.MMEAL_SC_NM,
        date: r.MLSV_YMD,
        servings: r.MLSV_FGR,
        dishRaw: r.DDISH_NM,
        originRaw: r.ORPLC_INFO,
        calorieRaw: r.CAL_INFO,
        nutritionRaw: r.NTR_INFO,
      }));
      return res.json({ success: true, meals, total: meals.length });
    }

    return res.json({ success: true, meals: [], total: 0 });
  } catch (err: any) {
    console.error('Meal fetch error:', err);
    return res.status(500).json({ success: false, error: err.message || '식단 조회 중 오류가 발생했습니다.' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer();
