package com.management.project.repositories;

import com.management.project.models.Project;
import com.management.project.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByLeader(User leader);
    List<Project> findByMembersContaining(User member);
}