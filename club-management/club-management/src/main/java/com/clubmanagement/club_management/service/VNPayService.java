package com.clubmanagement.club_management.service;

import com.clubmanagement.club_management.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    /**
     * Tạo URL thanh toán VNPay
     *
     * @param amount       Số tiền (VND, nhân 100 trước khi gửi cho VNPay)
     * @param orderId      Mã đơn hàng nội bộ (duy nhất)
     * @param orderInfo    Mô tả đơn hàng (VD: "Hội phí tháng 5")
     * @param ipAddress    IP của người dùng
     * @return URL để redirect người dùng sang VNPay
     */
    public String createPaymentUrl(long amount, String orderId, String orderInfo, String ipAddress) {
        String vnpVersion = "2.1.0";
        String vnpCommand = "pay";
        String vnpOrderType = "200000";
        String vnpLocale = "vn";
        String vnpCurrCode = "VND";

        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", vnpVersion);
        vnpParams.put("vnp_Command", vnpCommand);
        vnpParams.put("vnp_TmnCode", vnPayConfig.vnpTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100));
        vnpParams.put("vnp_CurrCode", vnpCurrCode);
        vnpParams.put("vnp_TxnRef", orderId);
        vnpParams.put("vnp_OrderInfo", removeAccent(orderInfo));
        vnpParams.put("vnp_OrderType", vnpOrderType);
        vnpParams.put("vnp_Locale", vnpLocale);
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.vnpReturnUrl);
        String cleanIp = ipAddress;
        if (cleanIp == null || cleanIp.contains(":") || cleanIp.equals("127.0.0.1") || cleanIp.equals("localhost")) {
            cleanIp = "127.0.0.1";
        }
        vnpParams.put("vnp_IpAddr", cleanIp);

        // Create date
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String vnpCreateDate = formatter.format(new Date());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);

        // Expire date (15 minutes)
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        cal.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", formatter.format(cal.getTime()));

        // Build query string and hash data
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value != null && value.length() > 0) {
                String encodedKey = encode(key);
                String encodedValue = encode(value);

                // Both hashData and query MUST use the same encoded values in VNPay v2.1.0
                hashData.append(encodedKey)
                        .append("=")
                        .append(encodedValue)
                        .append("&");

                query.append(encodedKey)
                        .append("=")
                        .append(encodedValue)
                        .append("&");
            }
        }
        // Remove trailing "&" from hashData and query if present
        if (hashData.length() > 0) hashData.deleteCharAt(hashData.length() - 1);
        if (query.length() > 0) query.deleteCharAt(query.length() - 1);

        String secureHash = hmacSHA512(vnPayConfig.vnpHashSecret, hashData.toString());
        
        System.out.println("=== VNPAY GENERATING PAYMENT URL ===");
        System.out.println("hashData: " + hashData.toString());
        System.out.println("secureHash: " + secureHash);
        System.out.println("queryUrl: " + vnPayConfig.vnpUrl + "?" + query + "&vnp_SecureHash=" + secureHash);
        System.out.println("====================================");
        query.append("&vnp_SecureHash=").append(secureHash);

        return vnPayConfig.vnpUrl + "?" + query;
    }

    /**
     * Xác thực callback từ VNPay (chống giả mạo)
     */
    public boolean validateCallback(Map<String, String> params) {
        Map<String, String> sortedParams = new TreeMap<>();
        
        // Filter only VNPAY parameters and sort them alphabetically
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key != null && key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                if (value != null && value.length() > 0) {
                    sortedParams.put(key, value);
                }
            }
        }

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            
            // In VNPay 2.1.0, callback parameters must be URL-encoded before hashing
            hashData.append(encode(key))
                    .append("=")
                    .append(encode(value))
                    .append("&");
        }
        if (hashData.length() > 0) hashData.deleteCharAt(hashData.length() - 1);

        String expectedHash = hmacSHA512(vnPayConfig.vnpHashSecret, hashData.toString());
        String actualHash = params.get("vnp_SecureHash");
        
        System.out.println("=== VNPAY VALIDATING CALLBACK ===");
        System.out.println("hashData: " + hashData.toString());
        System.out.println("expectedHash: " + expectedHash);
        System.out.println("actualHash: " + actualHash);
        System.out.println("isValid: " + expectedHash.equalsIgnoreCase(actualHash));
        System.out.println("=================================");
        
        return expectedHash.equalsIgnoreCase(actualHash);
    }

    private String encode(String value) {
        if (value == null) return "";
        try {
            return URLEncoder.encode(value, StandardCharsets.UTF_8.toString())
                    .replace("+", "%20")
                    .replace("*", "%2A")
                    .replace("%7E", "~");
        } catch (Exception e) {
            return "";
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] hash = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC-SHA512", e);
        }
    }

    private String removeAccent(String s) {
        if (s == null) return "";
        String temp = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(temp).replaceAll("")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^\\x00-\\x7F]", ""); // Loại bỏ các ký tự phi ASCII còn lại nếu có
    }
}

