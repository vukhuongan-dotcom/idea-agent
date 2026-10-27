/* ========================================
   IDEA AGENT — AI Integration
   Powered by DeepSeek API (OpenAI-compatible)
   ======================================== */

var AI = {
  async generateDraft(idea, settings) {
    const prompt = `Bạn là trợ lý cố vấn chiến lược y khoa & công nghệ cho BS. Vũ Khương An (BV Bình Dân, TP.HCM).
Phát triển ý tưởng sau thành bản thảo chuyên nghiệp:
- Tiêu đề: ${idea.title} | Danh mục: ${idea.category} | Ưu tiên: ${idea.priority} | Tags: ${(idea.tags || []).join(', ') || 'Không'}
- Nội dung gốc: ${idea.content || idea.title}

Yêu cầu bản thảo Markdown tiếng Việt:
### 1. Tổng quan ý tưởng
### 2. Phân tích SWOT
### 3. Kế hoạch triển khai & Nguồn lực
### 4. Kết quả kỳ vọng & KPIs
### 5. Rủi ro & Giải pháp
### 6. Action Items ngay (3-5 việc cần làm)`;

    return await this.call(prompt, settings);
  },

  async synthesizeIdeas(ideas, mode, settings) {
    const list = ideas.map((i, idx) => `[${idx + 1}] #${i.id.split('-').pop()} "${i.title}" (${i.category}/${i.priority}): ${i.content || i.title}`).join('\n');
    const modes = {
      research: 'ĐỀ CƯƠNG NCKH / SÁNG KIẾN CẢI TIẾN Y TẾ BV BÌNH DÂN (Tên đề cương, Cấp thiết, PICO, Đối tượng/PP, Kế hoạch, Giá trị thực tế)',
      actionplan: 'KẾ HOẠCH HÀNH ĐỘNG TỔNG THỂ (Tầm nhìn, Ma trận ưu tiên 3 giai đoạn, Checklist hành động, Quản trị rủi ro/nguồn lực, KPIs)',
      digest: 'BẢN TÓM TẮT ĐIỀU HÀNH & KẾT NỐI Ý TƯỞNG (Điểm chung, Giá trị cộng hưởng, Đánh giá khả thi/ưu tiên, Khuyến nghị)'
    };
    const prompt = `Dưới đây là ${ideas.length} ý tưởng của BS. Vũ Khương An:\n${list}\n\nYÊU CẦU: Tổng hợp thành ${modes[mode] || modes.research}.\nViết tiếng Việt, định dạng Markdown rõ ràng, chuyên nghiệp.`;
    return await this.call(prompt, settings);
  },

  async processAction(action, idea, settings) {
    const lastDraft = idea.drafts?.length ? idea.drafts[idea.drafts.length - 1].content : '';
    const base = `Ý tưởng: "${idea.title}" (${idea.category}/${idea.priority})\nNội dung: ${idea.content || idea.title}${lastDraft ? `\nBản thảo trước: ${lastDraft.substring(0, 1000)}...` : ''}`;
    const templates = {
      summarize: 'Tóm tắt nội dung sau thành 200-300 từ súc tích:',
      expand: 'Phân tích sâu và mở rộng ý tưởng sau với số liệu, luận cứ y khoa/công nghệ:',
      critique: 'Đóng vai chuyên gia phản biện khách quan, đánh giá (1. Điểm 1-10; 2. Điểm mạnh; 3. Lỗ hổng/rủi ro; 4. Đề xuất khắc phục; 5. Kết luận):',
      actionplan: 'Lập Action Plan chi tiết theo tuần/tháng kèm checklist và KPIs:',
      research_pico: 'Chuyển đổi thành ĐỀ CƯƠNG NCKH PICO cho BV Bình Dân (1. Tên đề tài; 2. Đặt vấn đề; 3. PICO; 4. Mục tiêu; 5. Phương pháp & Cỡ mẫu; 6. Ý nghĩa lâm sàng):',
      hospital_initiative: 'Chuyển đổi thành BÁO CÁO SÁNG KIẾN CẢI TIẾN CHẤT LƯỢNG BVBD (1. Tên sáng kiến; 2. Thực trạng; 3. Mục tiêu; 4. Giải pháp; 5. Kế hoạch RACI; 6. Hiệu quả; 7. Nhân rộng):',
      custom: settings.customPrompt || 'Phát triển tiếp ý tưởng sau:'
    };
    if (!templates[action]) return null;
    return await this.call(`${templates[action]}\n${base}\nViết tiếng Việt Markdown chuẩn mực.`, settings);
  },

  // Core API call — DeepSeek (OpenAI-compatible)
  async call(prompt, settings) {
    const apiKey = settings.geminiApiKey;
    const validModels = ['deepseek-chat', 'deepseek-reasoner'];
    const model = validModels.includes(settings.geminiModel) ? settings.geminiModel : 'deepseek-chat';

    if (!apiKey) {
      throw new Error('Vui lòng nhập DeepSeek API Key trong Cài đặt');
    }

    const requestBody = {
      model,
      messages: [
        { role: 'system', content: 'Bạn là trợ lý AI thông minh chuyên phát triển ý tưởng y khoa và công nghệ. Luôn trả lời bằng tiếng Việt, format Markdown.' },
        { role: 'user', content: prompt }
      ],
      stream: false,
    };

    if (model === 'deepseek-reasoner') {
      requestBody.max_tokens = 8192;
    } else {
      requestBody.temperature = 0.8;
      requestBody.max_tokens = 4096;
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody)
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

  callGemini(prompt, settings) { return this.call(prompt, settings); },
};

var GeminiAI = AI;
