CREATE DATABASE IF NOT EXISTS backofficesocial;
USE backofficesocial;

-- DROP TABLE IF EXISTS cargo;
CREATE TABLE cargo (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY cargo_nome_UN (nome)
);

INSERT INTO cargo (nome) VALUES ('Coordenador Docente'), ('Gestor de Equpe'), ('Coordenador de Projeto Especial'), ('Membro de Equipe');

-- DROP TABLE IF EXISTS equipe;
CREATE TABLE equipe (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY equipe_nome_UN (nome)
);

INSERT INTO equipe (nome) VALUES ('Administrador'), ('Marketing'), ('RH');

-- DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
  id int NOT NULL AUTO_INCREMENT,
  login varchar(100) NOT NULL,
  nome varchar(100) NOT NULL,
  idcargo int NOT NULL,
  idequipe int NOT NULL,
  versao int NOT NULL,
  senha varchar(100) NOT NULL,
  token char(32) DEFAULT NULL,
  criacao datetime NOT NULL,
  email varchar(100) NULL,
  telefone varchar(20) NULL,
  whatsapp varchar(20) NULL,
  rede_social varchar(100),
  curso varchar(50) NULL,
  periodo_entrada varchar(20) NULL, -- 2020/01 (Período do ano que o aluno se associou à Social)
  periodo_saida varchar(20), -- 2021/02 (Período do ano que o aluno saiu da Social)
  semestre_entrada int NULL, -- 1, 2 .... (Semestre que o aluno estava cursando quando se associou à Social)
  semestre_saida int NULL, -- 1, 2 .... (Semestre que o aluno estava cursando quando saiu da Social)
  semestre_atual int NULL, -- 1, 2 .... (Semestre que o aluno está cursando "atualmente")
  ativo tinyint(4) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY usuario_login_UN (login),
  KEY usuario_idcargo_FK_idx (idcargo),
  KEY usuario_idequipe_FK_idx (idequipe),
  CONSTRAINT usuario_idcargo_FK FOREIGN KEY (idcargo) REFERENCES cargo (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT usuario_idequipe_FK FOREIGN KEY (idequipe) REFERENCES equipe (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO usuario (login, nome, idcargo, idequipe, versao, senha, token, criacao, email, telefone, whatsapp, rede_social, curso, periodo_entrada, periodo_saida, semestre_entrada, semestre_saida, semestre_atual, ativo) VALUES ('admin', 'Administrador', 1, 1, 0, 'peTcC99vkvvLqGQL7mdhGuJZIvL2iMEqvCNvZw3475PJ:JVyo1Pg2HyDyw9aSOd3gNPT30KdEyiUYCjs7RUzSoYGN', NULL, NOW(), '', '', '', '', '', '', '', 0, 0, 0, 1);

-- DROP TABLE IF EXISTS historico_cargo;
CREATE TABLE historico_cargo (
  id int NOT NULL AUTO_INCREMENT,
  idusuario int NOT NULL,
  idcargo int NOT NULL,
  data datetime NOT NULL,
  PRIMARY KEY (id),
  KEY historico_cargo_idusuario_FK_idx (idusuario, idcargo),
  KEY historico_cargo_idcargo_FK_idx (idcargo),
  CONSTRAINT historico_cargo_idusuario_FK FOREIGN KEY (idusuario) REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT historico_cargo_idcargo_FK FOREIGN KEY (idcargo) REFERENCES cargo (id) ON DELETE CASCADE ON UPDATE RESTRICT
);

INSERT INTO historico_cargo (idusuario, idcargo, data) VALUES (1, 1, NOW());

-- DROP TABLE IF EXISTS causa;
CREATE TABLE causa (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY causa_nome_UN (nome)
);

INSERT INTO causa (nome) VALUES ('LGBT'), ('Racismo'), ('Crianças Abandonadas');

-- DROP TABLE IF EXISTS ong;
CREATE TABLE ong (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  telefone varchar(20) NOT NULL,
  endereco varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  criacao datetime NOT NULL,
  ativo tinyint(4) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ong_nome_UN (nome),
  KEY ong_ativo_FK_idx (ativo)
);

-- DROP TABLE IF EXISTS ong_causa;
CREATE TABLE ong_causa (
  id int NOT NULL AUTO_INCREMENT,
  idong int NOT NULL,
  idcausa int NOT NULL,
  PRIMARY KEY (id),
  KEY ong_causa_idong_FK_idx (idong),
  KEY ong_causa_idcausa_FK_idx (idcausa),
  CONSTRAINT ong_causa_idong_FK FOREIGN KEY (idong) REFERENCES ong (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT ong_causa_idcausa_FK FOREIGN KEY (idcausa) REFERENCES causa (id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- DROP TABLE IF EXISTS representante;
CREATE TABLE representante (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  idong int NOT NULL,
  email varchar(100) NOT NULL,
  telefone varchar(20) NOT NULL,
  whatsapp varchar(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY representante_nome_UN (nome),
  KEY representante_idong_FK_idx (idong),
  CONSTRAINT representante_idong_FK FOREIGN KEY (idong) REFERENCES ong (id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- DROP TABLE IF EXISTS orientador;
CREATE TABLE orientador (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY orientador_nome_UN (nome)
);

-- DROP TABLE IF EXISTS consultoria;
CREATE TABLE consultoria (
  id int NOT NULL AUTO_INCREMENT,
  idorientador int NOT NULL,
  idong int NOT NULL,
  ano int NOT NULL,
  PRIMARY KEY (id),
  KEY consultoria_idorientador_FK_idx (idorientador),
  KEY consultoria_idong_FK_idx (idong),
  KEY consultoria_ano_FK_idx (ano),
  CONSTRAINT consultoria_idorientador_FK FOREIGN KEY (idorientador) REFERENCES orientador (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT consultoria_idong_FK FOREIGN KEY (idong) REFERENCES ong (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- DROP TABLE IF EXISTS consultoria_usuario;
CREATE TABLE consultoria_usuario (
  id int NOT NULL AUTO_INCREMENT,
  idconsultoria int NOT NULL,
  idusuario int NOT NULL,
  PRIMARY KEY (id),
  KEY consultoria_usuario_idconsultoria_FK_idx (idconsultoria),
  KEY consultoria_usuario_idusuario_FK_idx (idusuario),
  CONSTRAINT consultoria_usuario_idconsultoria_FK FOREIGN KEY (idconsultoria) REFERENCES consultoria (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT consultoria_usuario_idusuario_FK FOREIGN KEY (idusuario) REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE RESTRICT
);
