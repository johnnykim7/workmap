package com.therecommerce.workmap.workitem.mapper;

import com.therecommerce.workmap.workitem.domain.ActivityLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ActivityLogMapper {

    void insert(ActivityLog log);

    List<ActivityLog> findByWorkItem(@Param("workItemId") Long workItemId);
}
