package com.therecommerce.workmap.notification.mapper;

import com.therecommerce.workmap.notification.domain.Notification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NotificationMapper {

    void insert(Notification notification);
}
