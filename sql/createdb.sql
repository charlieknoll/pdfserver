DROP TABLE "pdflog";
DROP TABLE "apikey";
DROP TABLE "users";
DROP TABLE "session";

CREATE TABLE "session" (
	"sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY,
	"email" varchar(255) UNIQUE,
    "resettoken" varchar(255),
    "tokenexpire" timestamp(6),
	"displayname" varchar(255),
	"passwordhash" varchar(100),
	"usertype" varchar(50)
);

CREATE TABLE "apikey" (
	"id" bigserial PRIMARY KEY,
	"userid" int NOT NULL REFERENCES users(id),
	"value" varchar(255) NOT NULL,
	"descr" varchar(255)
);

CREATE TABLE "pdflog" (
	"id" bigserial PRIMARY KEY,
	"apikeyid" int NOT NULL REFERENCES apikey(id),
    "type" varchar(1) NOT NULL,
    "hash" varchar(64) NOT NULL,
    "ipaddress" varchar(15) NOT NULL,
	"duration" int NOT NULL,
	"requesttime" timestamp,
    "networkdata" int NOT NULL,
    "filesize" int NOT NULL
);

INSERT INTO users(email,displayname,passwordhash,usertype) VALUES('admin@responsivepaper.com','Charlie','$2b$10$yOoZCexQiB6i7W.DF5heFuBWVZTVGnMZV2FuUWVDeDNb0V9ZT.Ife','admin')