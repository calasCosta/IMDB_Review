CREATE TABLE stats_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trained_models_id int not null,
  foreign key (trained_models_id) references trained_models (id)
  on update cascade
  on delete no action,
  limit_size INT NOT NULL,
  true_labels JSON NOT NULL,
  predicted_labels JSON NOT NULL,
  matrix JSON NOT NULL,
  metrics JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
