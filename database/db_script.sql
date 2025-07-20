CREATE TABLE `imdb_dataset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Review` text,
  `Sentiment` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33222 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `corpus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review` text NOT NULL,
  `sentiment` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33222 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `trained_models` (
  `id` int NOT NULL AUTO_INCREMENT,
  `model_name` varchar(100) NOT NULL,
  `trained_json` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `_limit` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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