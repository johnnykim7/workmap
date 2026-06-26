package com.therecommerce.workmap.board.controller;

import com.therecommerce.common.response.ResponseDto;
import com.therecommerce.workmap.board.dto.BoardDtos;
import com.therecommerce.workmap.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 보드 API (T3-2 G. 보드 / WMP-AGL-005·OPS-001). 인증 필요(🔒). */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping("/{projectId}/board")
    public ResponseDto<BoardDtos.BoardResponse> board(@PathVariable Long projectId) {
        return ResponseDto.success(boardService.board(projectId));
    }
}
