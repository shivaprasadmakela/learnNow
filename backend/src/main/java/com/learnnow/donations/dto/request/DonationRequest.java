package com.learnnow.donations.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonationRequest {

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Minimum donation amount is 1 INR")
    @Max(value = 500000, message = "Maximum donation amount is 5,00,000 INR")
    private Integer amount;

    @Size(max = 100, message = "Donor name cannot exceed 100 characters")
    private String donorName;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String donorEmail;

    @Size(max = 500, message = "Message cannot exceed 500 characters")
    private String message;
}
