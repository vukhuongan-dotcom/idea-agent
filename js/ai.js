/* ========================================
   IDEA AGENT — AI Integration
   Powered by DeepSeek API (OpenAI-compatible)
   ======================================== */

var AI = {

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
- Các bước cụ thể, timeline dự kiến
- Nguồn lực cần thiết

### 4. Kết quả kỳ vọng & KPIs

### 5. Rủi ro và giải pháp

### 6. Bước tiếp theo (3-5 action items ngay)

---
Viết bằng tiếng Việt, format Markdown, phong cách chuyên nghiệp.
Nếu liên quan y tế/phẫu thuật, dùng kiến thức chuyên ngành phù hợp.`;

    return await this.call(prompt, settings);
  },

  async processAction(action, idea, settings) {
    const lastDraft = idea.drafts.length > 0 ? idea.drafts[idea.drafts.length - 1].content : '';
    let prompt = '';

    switch (action) {
      case 'summarize':
        prompt = `Tóm tắt nội dung sau thành 200-300 từ, giữ các điểm chính:

**Ý tưởng**: ${idea.title}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo**: ${lastDraft}` : ''}

Viết tiếng Việt, format Markdown.`;
        break;

      case 'expand':
        prompt = `Phân tích chi tiết và mở rộng ý tưởng sau. Thêm ví dụ cụ thể, số liệu, evidence-based analysis:

**Ý tưởng**: ${idea.title}
**Danh mục**: ${idea.category}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo hiện tại**: ${lastDraft}` : ''}

Viết tiếng Việt, format Markdown.`;
        break;

      case 'critique':
        prompt = `Đóng vai chuyên gia phản biện, đánh giá khách quan:

**Ý tưởng**: ${idea.title}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo**: ${lastDraft}` : ''}

Cấu trúc:
1. Điểm tổng quan (1-10)
2. Điểm mạnh
3. Điểm yếu
4. Lỗ hổng logic/thực tế
5. Đề xuất cải thiện
6. Kết luận: Tiếp tục/điều chỉnh/bỏ?

Viết tiếng Việt, format Markdown, thẳng thắn.`;
        break;

      case 'actionplan':
        prompt = `Tạo Action Plan chi tiết từ ý tưởng sau:

**Ý tưởng**: ${idea.title}
**Danh mục**: ${idea.category}
**Ưu tiên**: ${idea.priority}
**Nội dung**: ${idea.content || idea.title}
${lastDraft ? `**Bản thảo**: ${lastDraft}` : ''}

Yêu cầu:
1. **Tuần 1**: Việc cần làm ngay
2. **Tuần 2-4**: Triển khai
3. **Tháng 2-3**: Hoàn thiện
4. **Checklist** dạng checkbox
5. **Resources** cần thiết
6. **KPIs** đo lường tiến độ

Viết tiếng Việt, format Markdown, có timeline cụ thể.`;
        break;

      default:
        return null;
    }

    return await this.call(prompt, settings);
  },

  // Core API call — DeepSeek (OpenAI-compatible)
  async call(prompt, settings) {
    const apiKey = settings.geminiApiKey;
    const model = settings.geminiModel || 'deepseek-chat';

    if (!apiKey) {
      throw new Error('Vui lòng nhập DeepSeek API Key trong Cài đặt');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý AI thông minh chuyên phát triển ý tưởng và tạo bản thảo chuyên nghiệp. Luôn trả lời bằng tiếng Việt, format Markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4096,
        stream: false,
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('AI không trả về nội dung');
    return text;
  },

  // Backward-compat aliases (capture.js / draft.js gọi GeminiAI)
  callGemini(prompt, settings) { return this.call(prompt, settings); },
};

// Backward-compat alias
var GeminiAI = AI;
