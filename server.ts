import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Support large image payloads in base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient Gemini generateContent with auto-retry and multi-model fallback
async function generateWithFallback(ai: GoogleGenAI, contents: any[], config?: any): Promise<string> {
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          ...config,
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini OCR] Model ${model} failed, attempting next available model:`, err?.message || err);
    }
  }

  throw lastError || new Error('Không thể kết nối tới mô hình AI. Vui lòng thử lại sau giây lát.');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI OCR Image scanning for Defect & Quality tables
app.post('/api/scan-defect-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', targetCategory = 'AUTO' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp dữ liệu hình ảnh (base64).' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const ai = getAI();

    const prompt = `
Bạn là chuyên gia OCR và phân tích dữ liệu sản xuất công nghiệp tại Phân xưởng Lắp ráp (PXLR).
Hãy đọc kỹ hình ảnh bảng biểu / Excel / báo cáo dữ liệu hư hỏng hoặc chất lượng đính kèm và trích xuất TOÀN BỘ danh sách các dòng vật tư tổn thất/hư hỏng.

Yêu cầu trích xuất chi tiết:
1. Nhận diện nhóm sản phẩm (category):
   - "RO" nếu là Máy lọc nước RO / DCRO / Lọc nước / Cốc lọc / Màng RO / Cút nối...
   - "BG" nếu là Bếp Gas / DCBG / SHB / MMB / Cụm đánh lửa / Đĩa chống tràn / Nẹp kính...
2. Mỗi dòng trích xuất bao gồm:
   - itemCode (string): Mã linh kiện / mã VT (ví dụ: "04-28-03-BRA590N-0007", "04-29-06-SHA76622KL-0000", "02-33-01-SHB3223MT-0001", v.v.)
   - itemName (string): Tên vật tư mô tả chính xác từ ảnh (ví dụ: "Van xả áp", "Vỏ carton MLN R.O Slim dùng chung", "Bộ dây nguồn tổng SHA76636KL", "Màng R.O TFC 100GPD", v.v.)
   - quantity (number): Số lượng vật tư hỏng (số nguyên hoặc thập phân)
   - unitPrice (number): Đơn giá (VND)
   - amount (number): Thành tiền = quantity * unitPrice (VND)
   - week (string): Tuần nếu có trong bảng (ví dụ: "W37", "W38", "W36", v.v.)
   - isHighlighted (boolean): true nếu dòng đó được tô màu vàng, đỏ, hồng hoặc đánh dấu nổi bật trong ảnh
   - category (string): "RO" hoặc "BG"
3. Trích xuất tổng thành tiền (grandTotal) được hiển thị trong ảnh (ví dụ 607,649.38 đ hoặc 754,482.82 đ).
4. Trích xuất các ghi chú hoặc đối sách nếu có trong ảnh.

Hãy trả về định dạng JSON thuần túy theo cấu trúc sau:
{
  "detectedCategory": "RO" | "BG" | "BOTH",
  "detectedTitle": "Tên báo cáo nhận diện được",
  "grandTotal": 607649.38,
  "items": [
    {
      "itemCode": "04-28-03-BRA590N-0007",
      "itemName": "Van xả áp",
      "quantity": 2,
      "unitPrice": 9999.58,
      "amount": 19999.16,
      "week": "W37",
      "category": "RO",
      "isHighlighted": false
    }
  ],
  "summaryNotes": "Ghi chú tóm tắt từ ảnh"
}
`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const responseText = await generateWithFallback(ai, contents);
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Fallback regex to clean markdown code blocks
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Error scanning image with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Có lỗi xảy ra khi xử lý và quét hình ảnh bằng AI. Vui lòng thử lại.',
    });
  }
});

// AI OCR Image scanning for Quality / Daily / NSLD report images
app.post('/api/scan-quality-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp dữ liệu hình ảnh (base64).' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const ai = getAI();

    const prompt = `
Bạn là chuyên gia phân tích báo cáo sản xuất công nghiệp PXLR.
Hãy đọc hình ảnh biểu đồ / bảng biểu chất lượng hoặc NSLĐ đính kèm và trích xuất các thông số:
- Các ngày hoặc tuần hoặc tháng
- Số liệu ĐM Vật Tư (%), Vật Tư (%), Total Lỗi 4M (%) cho PXLR, Line RO, Line BG
- Các lỗi trọng điểm và đối sách nếu có

Trả về định dạng JSON:
{
  "reportType": "QUALITY" | "NSLD" | "OTHER",
  "timeFrame": "day" | "week" | "month",
  "items": [
    {
      "label": "18/09" | "W38" | "T9",
      "pxlr": { "dmVatTu": number, "vatTu": number, "totalLoi4M": number },
      "ro": { "dmVatTu": number, "vatTu": number, "totalLoi4M": number },
      "bg": { "dmVatTu": number, "vatTu": number, "totalLoi4M": number }
    }
  ],
  "keyDefects": ["..."],
  "countermeasures": ["..."]
}
`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ];

    const responseText = await generateWithFallback(ai, contents);
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    return res.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Error scanning quality image:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Có lỗi xảy ra khi quét hình ảnh báo cáo chất lượng.',
    });
  }
});

// Vite & Static middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
