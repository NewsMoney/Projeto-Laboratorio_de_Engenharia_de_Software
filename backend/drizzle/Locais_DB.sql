CREATE TABLE checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,

  userId INT NOT NULL,
  placeId INT NOT NULL,

  rating INT NOT NULL,
  comment TEXT,

  occupancy ENUM('empty','moderate','full'),

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_checkins_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_checkins_place
    FOREIGN KEY (placeId) REFERENCES places(id)
    ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE places (
  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,

  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,

  category VARCHAR(100) DEFAULT 'general',

  description TEXT,
  imageUrl TEXT,

  createdById INT,

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_places_user
    FOREIGN KEY (createdById) REFERENCES users(id)
    ON DELETE SET NULL
);