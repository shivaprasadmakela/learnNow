package com.learnnow.dsa.controller;

import com.learnnow.dsa.dto.request.DsaRunRequest;
import com.learnnow.dsa.dto.request.DsaSubmitRequest;
import com.learnnow.dsa.dto.response.DsaEditorialDto;
import com.learnnow.dsa.dto.response.DsaHintDto;
import com.learnnow.dsa.dto.response.DsaProblemDetailDto;
import com.learnnow.dsa.dto.response.DsaRunResultDto;
import com.learnnow.dsa.dto.response.DsaSubmitResultDto;
import com.learnnow.dsa.service.DsaCatalogService;
import com.learnnow.dsa.service.DsaSubmissionService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * One problem, and the two actions that cost engine time.
 *
 * <p>The GET is public; the POSTs are not. That falls out of the security configuration rather than
 * being enforced here: the {@code permitAll} matcher for {@code /api/dsa/**} is scoped to {@code
 * HttpMethod.GET}, so everything below it stays behind the authenticated catch-all. Running code
 * proxies to a metered external engine, which is exactly what should not be anonymous.
 */
@RestController
@RequestMapping("/api/dsa/problems")
@RequiredArgsConstructor
public class DsaProblemController {

    private final DsaCatalogService catalogService;
    private final DsaSubmissionService submissionService;

    @GetMapping("/{slug}")
    public ResponseEntity<DsaProblemDetailDto> problemBySlug(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String slug) {
        String userId = jwt != null ? jwt.getSubject() : null;
        return ResponseEntity.ok(catalogService.problemBySlug(slug, userId));
    }

    /**
     * The same detail payload, looked up by id.
     *
     * <p>The bookmark list stores only the target id, so without this it would have to keep a slug
     * copy in sync - one more thing that can drift.
     */
    @GetMapping("/by-id/{problemId}")
    public ResponseEntity<DsaProblemDetailDto> byId(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID problemId) {
        String userId = jwt != null ? jwt.getSubject() : null;
        return ResponseEntity.ok(catalogService.problemById(problemId, userId));
    }

    /**
     * One hint, counting from one, fetched when the learner asks for it.
     *
     * <p>Public like the problem itself, since the hints are part of reading it. They used to ship
     * inside the detail payload, so all of them reached the browser whether or not the learner ever
     * pressed "show a hint".
     */
    @GetMapping("/{problemId}/hints/{n}")
    public ResponseEntity<DsaHintDto> hint(@PathVariable UUID problemId, @PathVariable int n) {
        return ResponseEntity.ok(catalogService.hint(problemId, n));
    }

    /**
     * The editorial, with every approach's code, fetched when the learner opens it.
     *
     * <p>Public for the same reason the hints are: it is content, and gating it behind a sign-in
     * would change what an anonymous reader can see rather than when it is sent. The page asks
     * before revealing it on an unsolved problem; this is what that question protects.
     */
    @GetMapping("/{problemId}/editorial")
    public ResponseEntity<DsaEditorialDto> editorial(@PathVariable UUID problemId) {
        return ResponseEntity.ok(catalogService.editorial(problemId));
    }

    /** Runs the sample cases, plus anything the learner typed into the panel. */
    @PostMapping("/{problemId}/run")
    public ResponseEntity<DsaRunResultDto> run(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID problemId,
            @Valid @RequestBody DsaRunRequest request) {
        return ResponseEntity.ok(submissionService.run(jwt.getSubject(), problemId, request));
    }

    /** Runs every case, records a submission, and may mark the problem solved. */
    @PostMapping("/{problemId}/submit")
    public ResponseEntity<DsaSubmitResultDto> submit(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID problemId,
            @Valid @RequestBody DsaSubmitRequest request) {
        return ResponseEntity.ok(submissionService.submit(jwt.getSubject(), problemId, request));
    }
}
