package com.therecommerce.workmap.burndown.scheduler;

import com.therecommerce.workmap.agile.domain.Sprint;
import com.therecommerce.workmap.agile.mapper.SprintMapper;
import com.therecommerce.workmap.burndown.service.BurndownService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/**
 * 번다운 일별 스냅샷 배치(WMP-AGL-006, CR-012). 매일 자정 직후 전 프로젝트 ACTIVE 스프린트의
 * 당일 DAILY 스냅샷을 적재한다(UNIQUE upsert로 멱등 — 재실행/중복 무해).
 *
 * <p>시작/완료 시점 스냅샷은 {@code BurndownEventListener}(이벤트)가, 중간 추이는 본 배치가 담당.
 * Clock 주입(테스트에서 날짜 Mock). @EnableScheduling은 AppConfig.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BurndownScheduler {

    private final SprintMapper sprintMapper;
    private final BurndownService burndownService;
    private final Clock clock;

    /** 매일 00:10(KST) 실행 — 전일 마감 직후 당일 잔여/누적완료 스냅샷. */
    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul")
    public void snapshotDailyForActiveSprints() {
        LocalDate today = LocalDate.now(clock);
        List<Sprint> active = sprintMapper.findAllActive();
        for (Sprint s : active) {
            try {
                burndownService.snapshotDaily(s.getId(), today);
            } catch (Exception e) {
                // 한 스프린트 실패가 나머지 적재를 막지 않도록 격리(배치 견고성)
                log.warn("번다운 일별 스냅샷 실패 sprintId={} date={}", s.getId(), today, e);
            }
        }
        log.info("번다운 일별 스냅샷 완료: {}개 ACTIVE 스프린트 (date={})", active.size(), today);
    }
}
