## MCP 運用ルール（AWS セッション切れ時の対応）

- 対象プロファイル: `trust-life-support-prod`
- セッションが切れて AWS API 呼び出しが `ExpiredToken` / `UnrecognizedClientException` / `The security token included in the request is expired` などで失敗した場合は、次のコマンドで再ログインしてから 1 回だけ自動リトライします。

```powershell
aws sso login --profile trust-life-support-prod
```

- 上記は UI ブラウザが開けない環境でもデバイスコードで認証できます。成功後は以下で確認できます。

```powershell
aws sts get-caller-identity --profile trust-life-support-prod
```

- 本プロジェクトの `.cursor/mcp.json` は `AWS_PROFILE=trust-life-support-prod` に固定されています。


