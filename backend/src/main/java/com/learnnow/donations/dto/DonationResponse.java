package com.learnnow.donations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponse {
    private String orderId;
    private Integer amount;
    private Integer amountInPaise;
    private String currency;
    private String keyId;
    private String status;
}
