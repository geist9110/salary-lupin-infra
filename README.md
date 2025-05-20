![월급 루팡 히어로 섹션](.github/assets/hero-section.png)

**Salary Lupin은 ‘일하지 않기 위해 일하는’ 사람들을 위한 플랫폼입니다.**  
이곳은 진짜로 아무 일도 하지 않으면서, 일하는 척은 아주 그럴듯하게 할 수 있는 공간입니다.

집중은 흐트러지고, 할 일은 애매하고, 회의는 끝나지 않습니다.  
그렇다고 탭을 닫기도 뭔가 애매한 이 순간,  
우리는 브라우저를 열어 무언가를 해야만 합니다.

Salary Lupin은 그럴 때 켜는 **가장 진지한 가벼움**입니다.  
한 번 들어오면 누구나 월급루팡, 한 번 웃고 나면 다시 직장인.  
일과 유희의 중간쯤에서, 우리는 당신의 월급루팡을 돕습니다.

[🔗 웹 사이트 바로가기](https://www.salary-lupin.com)

---

이 저장소는 Salary Lupin의 전체 인프라를 정의한 **IaC(Infrastructure as Code) 프로젝트**입니다.  
[프론트엔드](https://github.com/geist9110/salary-lupin-fe)
와 [백엔드](https://github.com/geist9110/salary-lupin-be)는 각각 별도의 저장소에서 관리되며, 인프라는 두 서비스를 통합하고, 개발-운영
환경(dev/prod) 분리를 기반으로 실제 운영이 가능한 클라우드 아키텍처를 구성합니다.

**네트워크**  
퍼블릭/프라이빗 서브넷을 가진 VPC

**백엔드**  
Spring Boot API 서버 + RDS(MySQL)

**프론트엔드**  
S3 + CloudFront 정적 호스팅

**보안**  
리소스별 SG 구성 및 인증서 발급

**자동화**  
CodePipeline + GitHub 연동을 통한 자동 배포

---

### 인프라

![Structure](.github/assets/infra-architecture.png)

> 화살표는 **리소스 간의 흐름**을 의미합니다.  
> A에서 B로 향하는 화살표는 **A리소스가 B리소스에서 사용**되고 있다는 의미입니다.  
> 이때 **화살표의 색상은 출발 지점의 색상**에 맞춰 표시됩니다.

---

### 스택 설명

| 스택                       | 설명                                       |
|--------------------------|------------------------------------------|
| VpcStack                 | 퍼블릭/프라이빗 서브넷을 포함한 VPC 생성                 |
| RdsStack                 | MySQL RDS 인스턴스 생성                        |
| BackendStack             | ALB, ASG, CodePipeline, api 레코드 생성       |
| FrontendStack            | S3, CloudFront, CodePipeline, www 레코드 생성 |
| FrontendCertificateStack | CloudFront용 인증서 발급                       |
| BackendCertificateStack  | ALB용 인증서 발급                              |
| SecurityGroupStack       | ALB, EC2, RDS용 보안 그룹 생성                  |

---

### 환경 변수

| 변수명                   | 설명                            | 예시               |
|-----------------------|-------------------------------|------------------|
| DOMAIN_NAME           | 사용할 도메인의 이름                   | salary-lupin.com |
| HOSTED_ZONE_ID        | 도메인의 hosted zone id           | -                |
| ACCOUNT_ID            | 배포할 계정의 id                    | -                |
| APP_NAME              | 배포할 어플리케이션의 이름                | salarylupin      |
| RDS_USER_NAME         | RDS root 사용자 이름               | root             |
| GITHUB_CONNECTION_ARN | Github App을 통한 connection arn | -                |
| GITHUB_OWNER          | Github 사용자 이름                 | geist9110        |
| GITHUB_REPO_FRONTEND  | Github Frontend Repo 이름       | salary-lupin-fe  |
| GITHUB_REPO_BACKEND   | Github Backend Repo 이름        | salary-lupin-be  |
| GITHUB_BRANCH         | Github에 배포할 브랜치 이름            | main             |
| KEY_PAIR_NAME         | EC2에 접속할 key pair 이름          | -                |

---

### 사전 요구 사항

1. AWS CLI 인증 완료

```bash
aws configure
```

2. CDK CLI 설치

```bash
npm install -g aws-cdk
```

3. `.env` 파일 준비  
   `env/[환경].env` 형식 (ex: `env/prod.env`)  
   필요한 변수는 [환경 변수](#환경-변수) 표를 참고

---

### 배포 방법

1. 라이브러리 설치

```bash
npm install
```

2. 환경에 따라 배포

```bash
NODE_ENV=[env] npm run cdk:deploy -- [스택 ID]
```

> --[스택 ID]는 CDK에서 배포할 특정 스택 이름을 명시할 때 사용합니다.  
> [env]는 CDK에서 배포할 환경의 이름을 명시할 때 사용합니다.  
> ex: NODE_ENV=prod npm run cdk:deploy --Frontend-Stack-prod

---
