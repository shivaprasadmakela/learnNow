package com.learnnow.trainer.resume.dto;

/** A job description to compare the resume with. Its length is checked by the service. */
public record ResumeMatchRequest(String jobDescription) {}
