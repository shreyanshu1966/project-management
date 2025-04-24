package com.management.project.repositories;

import com.management.project.models.Project;
import com.management.project.models.Task;
import com.management.project.models.TaskStatus;
import com.management.project.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByProject(Project project);
    List<Task> findByAssignedTo(User user);
    List<Task> findByProjectAndStatus(Project project, TaskStatus status);
    List<Task> findByAssignedToAndStatus(User user, TaskStatus status);
}