/* ========================================
   IDEA AGENT — Gemini AI Integration
   Direct API calls to Gemini
   ======================================== */

var GeminiAI = {

  // Generate a full draft from an idea
  async generateDraft(idea, settings) {
    const prompt = `Bạn là một chuyên gia tư vấn chiến lược kiêm trợ lý sáng tạo cho BS. Vũ Khương An — bác sĩ Phẫu thuật Đại trực tràng tại Bệnh viện Bình Dân, TP.HCM.

Hãy phát triển ý tưởng sau thành một bản thảo chi tiết, chuyên nghiệp:

## Ý tưởng
- **Tiêu đề**: ${idea.title}
- **Danh mục**: ${idea.category}
- **Mức ưu tiên**: ${idea.priority}
- **Tags**: ${idea.tags.join(', ') || 'Không có'}
- **Nội dung gốc**: ${idea.content || idea.title}

## Yêu cầu bản thảo

Hãy phát triển bản thảo theo cấu trúc sau:

### 1. Tổng quan ý tưởng
- Mô tả chi tiết concept
- Bối cảnh và động lực
- Tầm quan trọng và ý nghĩa

### 2. Phân tích SWOT
- **S** (Strengths): Điểm mạnh
- **W** (Weaknesses): Điểm yếu
- **O** (Opportunities): Cơ hội
- **T** (Threats): Thách thức

### 3. Kế hoạch thực hiện
- Các bước cụ thể (liệt kê chi tiết)
- Timeline dự kiến
- Nguồn lực cần thiết (nhân lực, thiết bị, tài chính)

### 4. Kết quả kỳ vọng
- Đầu ra cụ thể
- Chỉ số đo lường thành công
- Tác động dự kiến

### 5. Rủi ro và giải pháp
- Rủi ro tiềm ẩn
- Biện pháp giảm thiểu

### 6. Bước tiếp theo
- 3-5 action items cụ thể có thể bắt đầu ngay

---
Lưu ý:
- Viết bằng tiếng Việt
- Phong cách chuyên nghiệp nhưng dễ đọc
- Nếu ý tưởng liên quan đến y tế/phẫu thuật, hãy dùng kiến thức chuyên ngành phù hợp
- Nếu là ý tưởng công nghệ, hãy đề xuất các công cụ/framework cụ thể
- Format bằng Markdown`;

    return await this.callGemini(prompt, settings);
  },

  // Process specific AI actions
  async processAction(action, idea, settings) {
    const lastDraft = idea.drafts.length > 0 ? idea.drafts[idea.drafts.length - 1].content : '';
    let prompt = '';

    switch (action) {
      case 'summarize':
        prompt = `Tóm tắt nội dung sau thành một bản tóm tắt ngắn gọn (200-300 từ), giữ các điểm chính:

**Ý tưởng**: ${idea.title}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo hiện tại**: ${lastDraft}` : ''}

Viết bằng tiếng Việt, format Markdown.`;
        break;

      case 'expand':
        prompt = `Hãy phân tích chi tiết hơn và mở rộng ý tưởng/bản thảo sau. Thêm ví dụ cụ thể, số liệu tham khảo, và phân tích sâu hơn:

**Ý tưởng**: ${idea.title}
**Danh mục**: ${idea.category}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo hiện tại**: ${lastDraft}` : ''}

Viết bằng tiếng Việt, format Markdown. Tập trung vào chi tiết hóa và cung cấp evidence-based analysis.`;
        break;

      case 'critique':
        prompt = `Hãy đóng vai một chuyên gia phản biện và đánh giá khách quan ý tưởng sau. Chỉ ra điểm mạnh, điểm yếu, lỗ hổng logic, và đề xuất cải thiện:

**Ý tưởng**: ${idea.title}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo**: ${lastDraft}` : ''}

Cấu trúc phản biện:
1. Đánh giá tổng quan (1-10 điểm)
2. Điểm mạnh cần phát huy
3. Điểm yếu cần khắc phục
4. Lỗ hổng logic/thực tế
5. Đề xuất cải thiện cụ thể
6. Kết luận: Nên tiếp tục/điều chỉnh/bỏ?

Viết bằng tiếng Việt, format Markdown. Phong cách chuyên nghiệp, thẳng thắn.`;
        break;

      case 'actionplan':
        prompt = `Tạo một Action Plan chi tiết từ ý tưởng sau, với các bước cụ thể có thể bắt đầu ngay:

**Ý tưởng**: ${idea.title}
**Danh mục**: ${idea.category}
**Ưu tiên**: ${idea.priority}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo**: ${lastDraft}` : ''}

Yêu cầu Action Plan:
1. **Tuần 1**: Các việc cần làm ngay (urgent + important)
2. **Tuần 2-4**: Giai đoạn triển khai
3. **Tháng 2-3**: Giai đoạn hoàn thiện
4. **Checklist**: Danh sách công việc dạng checkbox
5. **Resources**: Công cụ, tài liệu, liên hệ cần thiết
6. **KPIs**: Chỉ số đo lường tiến độ

Viết bằng tiếng Việt, format Markdown. Rõ ràng, actionable, có timeline cụ thể.`;
        break;

      default:
        return null;
    }

    return await this.callGemini(prompt, settings);
  },

  // Call Gemini API using API Key
  async callGemini(prompt, settings) {
    const model = settings.geminiModel || 'gemini-2.5-flash';
    const apiKey = settings.geminiApiKey;

    if (!apiKey) {
      throw new Error('Vui lòng nhập API Key trong Cài đặt → 🔑 API Key');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('AI không trả về nội dung');
    }

    return text;
  },
};

