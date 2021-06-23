CREATE DATABASE IF NOT EXISTS backofficesocial DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE backofficesocial;

CREATE TABLE cargo (
  id int NOT NULL,
  nome varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY cargo_nome_UN (nome)
);

INSERT INTO cargo (id, nome) VALUES (0, 'Coordenador Docente'), (1, 'Gestor de Equipe'), (2, 'Coordenador de Projeto Especial'), (3, 'Membro de Equipe'), (4, 'Indefinido');

CREATE TABLE equipe (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY equipe_nome_UN (nome)
);

INSERT INTO equipe (nome) VALUES ('Administrador'), ('Marketing'), ('RH');

CREATE TABLE genero (
  id int NOT NULL,
  nome varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY genero_nome_UN (nome)
);

INSERT INTO genero (id, nome) VALUES (0, 'Não informado'), (1, 'Feminimo'), (2, 'Masculino'), (3, 'Não-binário'), (4, 'Cis'), (5, 'Trans');

CREATE TABLE curso (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY nome_UN (nome)
);

INSERT INTO curso (nome) VALUES ('Nenhum'), ('ADM'), ('RI'), ('PP'), ('CISO'), ('SI');

CREATE TABLE usuario (
  id int NOT NULL AUTO_INCREMENT,
  login varchar(100) NOT NULL,
  nome varchar(100) NOT NULL,
  idcargovigente int NOT NULL,
  idequipevigente int NULL,
  idcurso int NOT NULL,
  idgenero int NOT NULL,
  idcargo1 int NULL,
  idcargo2 int NULL,
  idcargo3 int NULL,
  idcargo4 int NULL,
  idcargo5 int NULL,
  idequipe1 int NULL,
  idequipe2 int NULL,
  idequipe3 int NULL,
  idequipe4 int NULL,
  idequipe5 int NULL,
  cargodata1 datetime NULL,
  cargodata2 datetime NULL,
  cargodata3 datetime NULL,
  cargodata4 datetime NULL,
  cargodata5 datetime NULL,
  versao int NOT NULL,
  senha varchar(100) NOT NULL,
  token char(32) NULL,
  email varchar(100) NULL,
  telefone varchar(20) NULL,
  whatsapp varchar(20) NULL,
  instagram varchar(100) NULL,
  facebook varchar(100) NULL,
  linkedin varchar(100) NULL,
  observacoes varchar(100) NULL,
  periodo_entrada varchar(20) NULL, -- 2020/01 (Período do ano que o aluno se associou à Social)
  periodo_saida varchar(20) NULL, -- 2021/02 (Período do ano que o aluno saiu da Social)
  data_entrada datetime NULL,
  data_saida datetime NULL,
  semestre_entrada int NULL, -- 1, 2 .... (Semestre que o aluno estava cursando quando se associou à Social)
  semestre_saida int NULL, -- 1, 2 .... (Semestre que o aluno estava cursando quando saiu da Social)
  semestre_atual int NULL, -- 1, 2 .... (Semestre que o aluno está cursando "atualmente")
  semestre_permanencia int NULL,
  colegiado tinyint NOT NULL,
  ativo tinyint NOT NULL,
  criacao datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY usuario_login_UN (login),
  KEY usuario_idcargovigente_FK_idx (idcargovigente),
  KEY usuario_idcurso_FK_idx (idcurso),
  KEY usuario_idgenero_FK_idx (idgenero),
  CONSTRAINT usuario_idcargovigente_FK FOREIGN KEY (idcargovigente) REFERENCES cargo (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT usuario_idcurso_FK FOREIGN KEY (idcurso) REFERENCES curso (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT usuario_idgenero_FK FOREIGN KEY (idgenero) REFERENCES genero (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO usuario (login, nome, idcargovigente, idequipevigente, idcurso, idgenero, versao, senha, colegiado, ativo, criacao) VALUES ('admin', 'Administrador', 0, 1, 1, 0, 0, 'peTcC99vkvvLqGQL7mdhGuJZIvL2iMEqvCNvZw3475PJ:JVyo1Pg2HyDyw9aSOd3gNPT30KdEyiUYCjs7RUzSoYGN', 0, 1, NOW());

CREATE TABLE causa (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY causa_nome_UN (nome)
);

INSERT INTO causa (nome) VALUES ('LGBT'), ('Racismo'), ('Crianças Abandonadas');

CREATE TABLE organizacao (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  idequipe_parceira int NULL,
  razao_social varchar(100) NULL,
  sigla varchar(100) NULL,
  semestre_atendimento varchar(100) NULL,
  descricao varchar(100) NULL,
  observacoes varchar(100) NULL,
  endereco varchar(100) NULL,
  email varchar(100) NULL,
  telefone varchar(20) NULL,
  site varchar(100) NULL,
  facebook varchar(100) NULL,
  instagram varchar(100) NULL,
  ativo tinyint NOT NULL,
  criacao datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY organizacao_nome_UN (nome),
  KEY organizacao_ativo_FK_idx (ativo)
);

CREATE TABLE organizacao_causa (
  id int NOT NULL AUTO_INCREMENT,
  idorganizacao int NOT NULL,
  idcausa int NOT NULL,
  PRIMARY KEY (id),
  KEY organizacao_causa_idorganizacao_FK_idx (idorganizacao),
  KEY organizacao_causa_idcausa_FK_idx (idcausa),
  CONSTRAINT organizacao_causa_idorganizacao_FK FOREIGN KEY (idorganizacao) REFERENCES organizacao (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT organizacao_causa_idcausa_FK FOREIGN KEY (idcausa) REFERENCES causa (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE representante (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  idorganizacao int NOT NULL,
  email varchar(100) NOT NULL,
  telefone varchar(20) NOT NULL,
  whatsapp varchar(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY representante_nome_UN (nome),
  KEY representante_idorganizacao_FK_idx (idorganizacao),
  CONSTRAINT representante_idorganizacao_FK FOREIGN KEY (idorganizacao) REFERENCES organizacao (id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE orientador (
  id int NOT NULL AUTO_INCREMENT,
  nome varchar(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY orientador_nome_UN (nome)
);

CREATE TABLE consultoria (
  id int NOT NULL AUTO_INCREMENT,
  idorientador int NOT NULL,
  idorganizacao int NOT NULL,
  ano int NOT NULL,
  PRIMARY KEY (id),
  KEY consultoria_idorientador_FK_idx (idorientador),
  KEY consultoria_idorganizacao_FK_idx (idorganizacao),
  KEY consultoria_ano_FK_idx (ano),
  CONSTRAINT consultoria_idorientador_FK FOREIGN KEY (idorientador) REFERENCES orientador (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT consultoria_idorganizacao_FK FOREIGN KEY (idorganizacao) REFERENCES organizacao (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

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
