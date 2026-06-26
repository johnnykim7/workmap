package com.therecommerce.workmap.admin.controller;

import com.therecommerce.common.paging.PageRequest;
import com.therecommerce.common.paging.PageResponse;
import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.workmap.admin.dto.AdminDtos;
import com.therecommerce.workmap.admin.service.AdminFieldSchemeService;
import com.therecommerce.workmap.admin.service.AdminMeasureService;
import com.therecommerce.workmap.admin.service.AdminWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 관리자 마스터 API (T3-2 H, WMP-ADM-001~003). 모든 엔드포인트는 OWNER/ADMIN 전용.
 *
 * <p>권한: bp-common-lib 0.1.0 JwtFilter가 principal.role에 {@code ROLE_} 접두를 붙여
 * {@code SimpleGrantedAuthority}로 세팅하므로, {@code hasAnyRole}로 가드한다(UserController와 동일 컨벤션).
 * 거부는 WmpSecurityExceptionHandler가 403으로 매핑(CR-007).
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
public class AdminController {

    private final AdminMeasureService measureService;
    private final AdminFieldSchemeService fieldSchemeService;
    private final AdminWorkflowService workflowService;

    // ───────────────────────── 측정 단위 (WMP-ADM-001) ─────────────────────────

    @GetMapping("/measure-units")
    public ResponseDto<PageResponse<AdminDtos.MeasureUnitResponse>> listMeasureUnits(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseDto.success(measureService.list(new PageRequest(page, size)));
    }

    @PostMapping("/measure-units")
    public ResponseDto<AdminDtos.MeasureUnitResponse> createMeasureUnit(
            @Valid @RequestBody AdminDtos.MeasureUnitRequest req) {
        return ResponseDto.success(measureService.create(req));
    }

    @PutMapping("/measure-units/{id}")
    public ResponseDto<AdminDtos.MeasureUnitResponse> updateMeasureUnit(
            @PathVariable Long id, @Valid @RequestBody AdminDtos.MeasureUnitRequest req) {
        return ResponseDto.success(measureService.update(id, req));
    }

    @DeleteMapping("/measure-units/{id}")
    public ResponseDto<Void> deleteMeasureUnit(@PathVariable Long id) {
        measureService.delete(id);
        return ResponseDto.success(null);
    }

    // ───────────────────────── 필드 스킴 (WMP-ADM-002) ─────────────────────────

    @GetMapping("/field-schemes")
    public ResponseDto<PageResponse<AdminDtos.FieldSchemeResponse>> listFieldSchemes(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String issueTypeCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseDto.success(
                fieldSchemeService.list(projectId, issueTypeCode, new PageRequest(page, size)));
    }

    @PostMapping("/field-schemes")
    public ResponseDto<AdminDtos.FieldSchemeResponse> createFieldScheme(
            @Valid @RequestBody AdminDtos.FieldSchemeRequest req) {
        return ResponseDto.success(fieldSchemeService.create(req));
    }

    @PutMapping("/field-schemes/{id}")
    public ResponseDto<AdminDtos.FieldSchemeResponse> updateFieldScheme(
            @PathVariable Long id, @Valid @RequestBody AdminDtos.FieldSchemeRequest req) {
        return ResponseDto.success(fieldSchemeService.update(id, req));
    }

    @DeleteMapping("/field-schemes/{id}")
    public ResponseDto<Void> deleteFieldScheme(@PathVariable Long id) {
        fieldSchemeService.delete(id);
        return ResponseDto.success(null);
    }

    // ───────────────────────── 워크플로 (WMP-ADM-003) ─────────────────────────

    @GetMapping("/workflows")
    public ResponseDto<PageResponse<AdminDtos.WorkflowResponse>> listWorkflows(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseDto.success(workflowService.list(new PageRequest(page, size)));
    }

    @PostMapping("/workflows")
    public ResponseDto<AdminDtos.WorkflowResponse> createWorkflow(
            @Valid @RequestBody AdminDtos.WorkflowRequest req) {
        return ResponseDto.success(workflowService.create(req));
    }

    @PutMapping("/workflows/{id}")
    public ResponseDto<AdminDtos.WorkflowResponse> updateWorkflow(
            @PathVariable Long id, @Valid @RequestBody AdminDtos.WorkflowRequest req) {
        return ResponseDto.success(workflowService.update(id, req));
    }

    @DeleteMapping("/workflows/{id}")
    public ResponseDto<Void> deleteWorkflow(@PathVariable Long id) {
        workflowService.delete(id);
        return ResponseDto.success(null);
    }

    // 워크플로 상태
    @GetMapping("/workflows/{id}/statuses")
    public ResponseDto<List<AdminDtos.WorkflowStatusResponse>> listStatuses(@PathVariable Long id) {
        return ResponseDto.success(workflowService.listStatuses(id));
    }

    @PostMapping("/workflows/{id}/statuses")
    public ResponseDto<AdminDtos.WorkflowStatusResponse> addStatus(
            @PathVariable Long id, @Valid @RequestBody AdminDtos.WorkflowStatusRequest req) {
        return ResponseDto.success(workflowService.addStatus(id, req));
    }

    @PutMapping("/workflows/{id}/statuses/{statusId}")
    public ResponseDto<AdminDtos.WorkflowStatusResponse> updateStatus(
            @PathVariable Long id, @PathVariable Long statusId,
            @Valid @RequestBody AdminDtos.WorkflowStatusRequest req) {
        return ResponseDto.success(workflowService.updateStatus(id, statusId, req));
    }

    @DeleteMapping("/workflows/{id}/statuses/{statusId}")
    public ResponseDto<Void> deleteStatus(@PathVariable Long id, @PathVariable Long statusId) {
        workflowService.deleteStatus(id, statusId);
        return ResponseDto.success(null);
    }

    // 워크플로 전이(화이트리스트)
    @GetMapping("/workflows/{id}/transitions")
    public ResponseDto<List<AdminDtos.WorkflowTransitionResponse>> listTransitions(@PathVariable Long id) {
        return ResponseDto.success(workflowService.listTransitions(id));
    }

    @PostMapping("/workflows/{id}/transitions")
    public ResponseDto<AdminDtos.WorkflowTransitionResponse> addTransition(
            @PathVariable Long id, @Valid @RequestBody AdminDtos.WorkflowTransitionRequest req) {
        return ResponseDto.success(workflowService.addTransition(id, req));
    }

    @DeleteMapping("/workflows/{id}/transitions/{transitionId}")
    public ResponseDto<Void> deleteTransition(@PathVariable Long id, @PathVariable Long transitionId) {
        workflowService.deleteTransition(id, transitionId);
        return ResponseDto.success(null);
    }
}
