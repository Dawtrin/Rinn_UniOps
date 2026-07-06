package com.clubmanagement.club_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiAssistantService {

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.model}")
    private String aiModel;

    private final RestTemplate restTemplate = new RestTemplate();

    // #37 — Lưu lịch sử hội thoại theo userId (in-memory, tối đa 20 lượt/user)
    private final Map<String, List<Map<String, String>>> conversationHistory = new ConcurrentHashMap<>();
    private static final int MAX_HISTORY = 20;

    public String suggestAssignees(String taskTitle, String taskDescription, List<String> availableMembers) {
        String prompt = "Bạn là trợ lý AI cho một câu lạc bộ sinh viên. " +
                "Dưới đây là tiêu đề công việc: '" + taskTitle + "' và mô tả công việc: '" + taskDescription + "', " +
                "cùng danh sách thành viên hiện có: " + String.join(", ", availableMembers) + ". " +
                "Hãy gợi ý 1-2 thành viên phù hợp nhất cho công việc này. Chỉ trả lời bằng tiếng Việt tên các thành viên và lý do ngắn gọn trong 1 câu.";
        return callAiApi(prompt);
    }

    public String summarizeMeeting(String meetingContent) {
        String prompt = "Hãy tóm tắt nội dung cuộc họp sau đây thành các đầu mục công việc (action items) rõ ràng, ngắn gọn bằng tiếng Việt dưới dạng danh sách gạch đầu dòng:\n" + meetingContent;
        return callAiApi(prompt);
    }

    /** #37 — Chat có lưu lịch sử hội thoại theo userId */
    public String chat(String userId, String userMessage) {
        List<Map<String, String>> history = conversationHistory.computeIfAbsent(userId, k -> new ArrayList<>());

        // Add user message to history
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        history.add(userMsg);

        // Trim history if too long
        while (history.size() > MAX_HISTORY) history.remove(0);

        String response = callAiApiWithHistory(history);

        // Add assistant reply to history
        Map<String, String> assistantMsg = new HashMap<>();
        assistantMsg.put("role", "assistant");
        assistantMsg.put("content", response);
        history.add(assistantMsg);

        return response;
    }

    /** Xóa lịch sử hội thoại của user */
    public void clearHistory(String userId) {
        conversationHistory.remove(userId);
    }

    private String callAiApi(String prompt) {
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> msg = new HashMap<>();
        msg.put("role", "user");
        msg.put("content", prompt);
        messages.add(msg);
        return callAiApiWithHistory(messages);
    }

    private String callAiApiWithHistory(List<Map<String, String>> messages) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("dummy_key")) {
            String lastMsg = messages.isEmpty() ? "" : messages.get(messages.size()-1).getOrDefault("content", "");
            return "AI Feature is running in Dummy Mode (API Key not configured). " +
                    "\nSimulated response for: " + lastMsg.substring(0, Math.min(lastMsg.length(), 50)) + "...";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            if (apiUrl.contains("openai")) {
                headers.setBearerAuth(apiKey);
                List<Map<String, String>> openAiMessages = new ArrayList<>();
                Map<String, String> systemMsg = new HashMap<>();
                systemMsg.put("role", "system");
                systemMsg.put("content", "Bạn là trợ lý AI thông minh cho câu lạc bộ sinh viên. Hãy luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện và hữu ích.");
                openAiMessages.add(systemMsg);
                openAiMessages.addAll(messages);

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", aiModel);
                requestBody.put("messages", openAiMessages);
                requestBody.put("temperature", 0.7);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
                
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && responseBody.containsKey("choices")) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> choice = choices.get(0);
                        Map<String, String> msg = (Map<String, String>) choice.get("message");
                        return msg.get("content");
                    }
                }
            } else if (apiUrl.contains("generativelanguage")) {
                String fullUrl = apiUrl + "?key=" + apiKey;

                // Build Gemini contents from messages list
                List<Map<String, Object>> contents = new ArrayList<>();
                boolean isFirst = true;
                for (Map<String, String> m : messages) {
                    Map<String, Object> part = new HashMap<>();
                    String text = m.get("content");
                    if (isFirst && "user".equals(m.get("role"))) {
                        text = "[System Instruction: Bạn là trợ lý AI thông minh cho câu lạc bộ sinh viên. Hãy luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện và hữu ích.]\n\n" + text;
                        isFirst = false;
                    }
                    part.put("text", text);
                    Map<String, Object> content = new HashMap<>();
                    content.put("role", "user".equals(m.get("role")) ? "user" : "model");
                    content.put("parts", List.of(part));
                    contents.add(content);
                }

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("contents", contents);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(fullUrl, request, Map.class);
                
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && responseBody.containsKey("candidates")) {
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                    if (!candidates.isEmpty()) {
                        Map<String, Object> candidate = candidates.get(0);
                        Map<String, Object> candContent = (Map<String, Object>) candidate.get("content");
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) candContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                }
            }
            return "AI failed to generate a response.";
        } catch (Exception e) {
            return "Error communicating with AI service: " + e.getMessage();
        }
    }
}
