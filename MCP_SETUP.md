# Supabase MCP (Model Context Protocol) Setup Guide

## 개요 (Overview)

Supabase MCP 서버를 설치하면 AI 어시스턴트(Claude, Cursor 등)가 Supabase 프로젝트와 직접 대화하고 데이터베이스 작업을 수행할 수 있습니다.

The Supabase MCP Server enables AI assistants (Claude, Cursor, etc.) to directly interact with your Supabase project and perform database operations.

## 📦 설치 완료 (Installation Completed)

✅ `@supabase/mcp-server-supabase@latest` 패키지가 설치되었습니다.

## 🔑 Step 1: Supabase Personal Access Token 생성

1. Supabase Dashboard에 로그인: https://supabase.com/dashboard
2. 우측 상단 프로필 → **Account Settings** 클릭
3. 좌측 메뉴에서 **Access Tokens** 선택
4. **Generate new token** 버튼 클릭
5. Token 이름 입력 (예: "Literacy MCP Server")
6. **Generate token** 클릭
7. ⚠️ **생성된 토큰을 안전하게 복사하세요** (다시 볼 수 없습니다!)

## 🔧 Step 2: MCP Client 설정

### Claude Desktop 사용 시

Claude Desktop 설정 파일을 편집합니다:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS/Linux:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**설정 내용:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      ]
    }
  }
}
```

### Cursor 사용 시

1. Cursor 설정 열기: `Cmd/Ctrl + ,`
2. **MCP** 섹션 찾기
3. 다음 설정 추가:

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--access-token",
          "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
        ]
      }
    }
  }
}
```

## 🚀 Step 3: MCP 서버 실행 테스트

프로젝트 디렉토리에서 다음 명령어로 MCP 서버를 테스트할 수 있습니다:

```bash
npx @supabase/mcp-server-supabase@latest --access-token YOUR_TOKEN
```

## 🎯 MCP로 할 수 있는 작업

MCP 서버가 설정되면 AI 어시스턴트에게 다음과 같은 작업을 자연어로 요청할 수 있습니다:

### 데이터베이스 관리
- 테이블 생성/삭제/수정
- 스키마 확인 및 변경
- 인덱스 관리
- 외래 키 관계 설정

### 데이터 작업
- 데이터 조회 (SELECT)
- 데이터 삽입 (INSERT)
- 데이터 업데이트 (UPDATE)
- 데이터 삭제 (DELETE)

### 프로젝트 설정
- Supabase 프로젝트 정보 확인
- 환경 변수 관리
- 인증 설정 확인

### 예시 명령어

```
"Show me all tables in my Supabase project"
"Create a new column 'email' in the users table"
"Query the students table where grade >= 7"
"Update the assessment_questions table to add a new difficulty parameter"
```

## 🔒 보안 주의사항

1. **Personal Access Token은 절대 공개하지 마세요**
   - Git 저장소에 커밋하지 않기
   - 환경 변수나 안전한 비밀 관리 도구 사용

2. **개발 환경에서만 사용하세요**
   - MCP 서버는 개발자 권한으로 실행됩니다
   - 프로덕션 환경이나 최종 사용자에게 제공하지 마세요

3. **토큰 권한 최소화**
   - 필요한 권한만 부여
   - 정기적으로 토큰 갱신

## 🛠️ 문제 해결

### MCP 서버가 연결되지 않는 경우

1. Personal Access Token이 올바른지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 상태 확인
4. Claude/Cursor 앱을 재시작

### 권한 오류가 발생하는 경우

1. Personal Access Token의 권한 범위 확인
2. Supabase 프로젝트의 Role 권한 확인

## 📚 추가 리소스

- [Supabase MCP 공식 문서](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol 사양](https://modelcontextprotocol.io/)
- [GitHub: supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)

## ✅ 다음 단계

MCP 설정이 완료되면:

1. Supabase 프로젝트 생성 (아직 안 했다면)
2. `SUPABASE_SETUP.md` 가이드를 따라 데이터베이스 마이그레이션
3. AI 어시스턴트를 통해 자연어로 데이터베이스 작업 수행

---

**설치 완료!** 🎉

이제 AI 어시스턴트가 Supabase 데이터베이스와 직접 대화할 수 있습니다.
