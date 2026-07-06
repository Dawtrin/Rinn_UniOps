package com.clubmanagement.club_management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VNPayConfig {

    @Value("${vnpay.tmn-code}")
    public String vnpTmnCode;

    @Value("${vnpay.hash-secret}")
    public String vnpHashSecret;

    @Value("${vnpay.url}")
    public String vnpUrl;

    @Value("${vnpay.return-url}")
    public String vnpReturnUrl;
}
