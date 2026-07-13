param(
    [string]$BackendBase = "http://127.0.0.1:8889",
    [string]$FrontendBase = "http://127.0.0.1:8800"
)

$ErrorActionPreference = "Stop"

function ConvertFrom-Utf8Base64 {
    param([string]$Value)
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

function Invoke-AgentRoute {
    param(
        [string]$Question,
        [string]$ExpectedRoute,
        [string]$ExpectedTool = "",
        [switch]$AllowDirectAnswer,
        [hashtable]$Context = @{ surface = "agent-demo-regression" }
    )

    $body = @{
        message = $Question
        attachments = @()
        context = $Context
    } | ConvertTo-Json -Depth 8

    $response = Invoke-RestMethod `
        -Uri "$BackendBase/api/agent/route" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))

    $data = $response.data
    $routeOk = $response.code -eq "200" -and $data.route -eq $ExpectedRoute
    $toolOk = [string]::IsNullOrWhiteSpace($ExpectedTool) -or $data.tool -eq $ExpectedTool
    $directAnswerOk = $AllowDirectAnswer -and
        $response.code -eq "200" -and
        $data.route -eq "DIRECT_ANSWER" -and
        [string]::IsNullOrWhiteSpace([string]$data.tool)

    [PSCustomObject]@{
        Case = $Question
        Pass = ($routeOk -and $toolOk) -or $directAnswerOk
        Route = $data.route
        Tool = $data.tool
        Expected = if ($AllowDirectAnswer -and $ExpectedTool) { "$ExpectedRoute/$ExpectedTool or DIRECT_ANSWER" } elseif ($ExpectedTool) { "$ExpectedRoute/$ExpectedTool" } else { $ExpectedRoute }
        Confidence = $data.confidence
    }
}

function Invoke-AgentRouteForbiddenTool {
    param(
        [string]$Question,
        [string]$ForbiddenTool
    )

    $body = @{
        message = $Question
        attachments = @()
        context = @{ surface = "agent-demo-regression-negative" }
    } | ConvertTo-Json -Depth 8

    $response = Invoke-RestMethod `
        -Uri "$BackendBase/api/agent/route" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))

    $data = $response.data
    [PSCustomObject]@{
        Case = $Question
        Pass = $response.code -eq "200" -and $data.tool -ne $ForbiddenTool
        Route = $data.route
        Tool = $data.tool
        Expected = "not $ForbiddenTool"
        Confidence = $data.confidence
    }
}

function Invoke-TextAttachmentRoute {
    param(
        [string]$Extension,
        [string]$MimeType,
        [string]$CaseName,
        [string]$Note,
        [string]$Surface
    )

    $testFile = Join-Path $env:TEMP "agent-regression-note.$Extension"
    [System.IO.File]::WriteAllText($testFile, $Note, [Text.Encoding]::UTF8)

    $uploadRaw = & curl.exe -s -X POST "$BackendBase/api/file/upload/temp" -F "file=@$testFile;type=$MimeType"
    $upload = $uploadRaw | ConvertFrom-Json
    if ($upload.code -ne "200") {
        throw "Temp $Extension upload failed: $uploadRaw"
    }

    $file = $upload.data
    $body = @{
        message = ConvertFrom-Utf8Base64 "6K+35oC757uT6L+Z5Liq5paH5qGj"
        attachments = @(@{
            fileId = [string]$file.id
            fileName = $file.originalName
            mediaType = "DOCUMENT"
            size = $file.fileSize
            mimeType = $MimeType
            filePath = $file.filePath
        })
        context = @{ surface = $Surface }
    } | ConvertTo-Json -Depth 8

    $response = Invoke-RestMethod `
        -Uri "$BackendBase/api/agent/route" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))

    $context = [string]$response.data.attachmentContext
    [PSCustomObject]@{
        Case = $CaseName
        Pass = $response.code -eq "200" -and
            $response.data.route -eq "DIRECT_ANSWER" -and
            -not [string]::IsNullOrWhiteSpace($context) -and
            $context.Contains($Note)
        Route = $response.data.route
        Tool = $response.data.tool
        Expected = "DIRECT_ANSWER with attachmentContext"
        Confidence = $response.data.confidence
    }
}

function Invoke-AttachmentRoute {
    Invoke-TextAttachmentRoute `
        -Extension "txt" `
        -MimeType "text/plain" `
        -CaseName "uploaded txt summary" `
        -Note "Sanxingdui bronze tree note. The document says bronze tree is related to ritual communication between heaven and earth." `
        -Surface "agent-demo-regression-attachment"
}

function Invoke-MarkdownAttachmentRoute {
    Invoke-TextAttachmentRoute `
        -Extension "md" `
        -MimeType "text/markdown" `
        -CaseName "uploaded md summary" `
        -Note "# Markdown regression marker`nThe markdown file says Jinsha and Sanxingdui share ancient Shu ritual symbols." `
        -Surface "agent-demo-regression-markdown"
}

function New-TestDocx {
    param(
        [string]$Path,
        [string]$Text
    )

    $workDir = Join-Path $env:TEMP ("agent-regression-docx-" + [Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $workDir "_rels") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $workDir "word") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $workDir "word\_rels") | Out-Null

    $escaped = [System.Security.SecurityElement]::Escape($Text)
    [System.IO.File]::WriteAllText((Join-Path $workDir "[Content_Types].xml"), @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"@, [Text.Encoding]::UTF8)

    [System.IO.File]::WriteAllText((Join-Path $workDir "_rels\.rels"), @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@, [Text.Encoding]::UTF8)

    [System.IO.File]::WriteAllText((Join-Path $workDir "word\document.xml"), @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>$escaped</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
"@, [Text.Encoding]::UTF8)

    [System.IO.File]::WriteAllText((Join-Path $workDir "word\_rels\document.xml.rels"), @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
"@, [Text.Encoding]::UTF8)

    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Force
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($workDir, $Path)
    Remove-Item -LiteralPath $workDir -Recurse -Force
}

function Invoke-DocxAttachmentRoute {
    $testFile = Join-Path $env:TEMP "agent-regression-note.docx"
    $note = "DOCX regression marker: bronze tree ritual pathway and golden mask context."
    New-TestDocx -Path $testFile -Text $note

    $uploadRaw = & curl.exe -s -X POST "$BackendBase/api/file/upload/temp" -F "file=@$testFile;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    $upload = $uploadRaw | ConvertFrom-Json
    if ($upload.code -ne "200") {
        throw "Temp docx upload failed: $uploadRaw"
    }

    $file = $upload.data
    $body = @{
        message = ConvertFrom-Utf8Base64 "6K+35oC757uT6L+Z5Liq5paH5qGj"
        attachments = @(@{
            fileId = [string]$file.id
            fileName = $file.originalName
            mediaType = "DOCUMENT"
            size = $file.fileSize
            mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filePath = $file.filePath
        })
        context = @{ surface = "agent-demo-regression-docx" }
    } | ConvertTo-Json -Depth 8

    $response = Invoke-RestMethod `
        -Uri "$BackendBase/api/agent/route" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))

    $context = [string]$response.data.attachmentContext
    [PSCustomObject]@{
        Case = "uploaded docx summary"
        Pass = $response.code -eq "200" -and
            $response.data.route -eq "DIRECT_ANSWER" -and
            -not [string]::IsNullOrWhiteSpace($context) -and
            $context.Contains($note)
        Route = $response.data.route
        Tool = $response.data.tool
        Expected = "DIRECT_ANSWER with docx attachmentContext"
        Confidence = $response.data.confidence
    }
}

$routeCases = @(
    @{ Question = ConvertFrom-Utf8Base64 "5LuK5aSp5Yeg5Y+377yf"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "get_current_datetime"; AllowDirectAnswer = $true },
    @{ Question = ConvertFrom-Utf8Base64 "5oiQ6YO95aSp5rCU5oCO5LmI5qC377yf"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "get_weather" },
    @{ Question = ConvertFrom-Utf8Base64 "5p+l5om+5LuK5aSp5aSp5rCU"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "get_weather" },
    @{ Question = ConvertFrom-Utf8Base64 "5omT5byA5ZWG5Z+O5pCc57Si6YeR6Z2i5YW35paH5Yib"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "search_product" },
    @{ Question = ConvertFrom-Utf8Base64 "5LiJ5pif5aCG56Wt56WA5Z2R5Li65LuA5LmI6YeN6KaB77yf"; ExpectedRoute = "RAG"; ExpectedTool = "" },
    @{ Question = ConvertFrom-Utf8Base64 "5omT5byA6YeR6Z2i5YW355qE5pe256m65bGV57q/"; ExpectedRoute = "TOOL_CALL"; ExpectedTool = "control_trail" }
)

$results = foreach ($case in $routeCases) {
    Invoke-AgentRoute @case
}

$negativeRouteResults = @(
    Invoke-AgentRouteForbiddenTool `
        -Question (ConvertFrom-Utf8Base64 "5p+l5om+6Z2S6ZOc56We5qCR6LWE5paZ") `
        -ForbiddenTool "search_product"
)

$goldMaskContext = @{
    surface = "agent-demo-regression-context"
    currentPage = "/trail"
    currentScene = ConvertFrom-Utf8Base64 "5pe256m65bGV57q/"
    currentArtifact = ConvertFrom-Utf8Base64 "6YeR6Z2i5YW3"
    currentArtifactId = "HI-2025-002"
    currentTrailNode = "artifact-focus"
}

$bronzeTreeContext = @{
    surface = "agent-demo-regression-context"
    currentPage = "/trail"
    currentScene = ConvertFrom-Utf8Base64 "5pe256m65bGV57q/"
    currentArtifact = ConvertFrom-Utf8Base64 "6Z2S6ZOc56We5qCR"
    currentArtifactId = "HI-2025-006"
    currentTrailNode = "guide"
}

$contextRouteResults = @(
    Invoke-AgentRoute `
        -Question (ConvertFrom-Utf8Base64 "5a6D5piv5LuA5LmI5p2Q6LSo77yf") `
        -ExpectedRoute "RAG" `
        -Context $goldMaskContext
    Invoke-AgentRoute `
        -Question (ConvertFrom-Utf8Base64 "5a6D5ZKM56Wt56WA5pyJ5LuA5LmI5YWz57O777yf") `
        -ExpectedRoute "RAG" `
        -Context $bronzeTreeContext
)

$attachmentResult = Invoke-AttachmentRoute
$markdownAttachmentResult = Invoke-MarkdownAttachmentRoute
$docxAttachmentResult = Invoke-DocxAttachmentRoute

$expectedTools = @(
    "navigate_to",
    "search_product",
    "search_heritage",
    "control_trail",
    "get_weather",
    "get_current_datetime",
    "open_artifact_detail",
    "play_voice_intro"
)
$toolsResponse = Invoke-RestMethod -Uri "$BackendBase/api/agent/tools" -Method Get
$actualTools = @($toolsResponse.data | ForEach-Object { $_.name } | Sort-Object)
$expectedSortedTools = @($expectedTools | Sort-Object)
$toolDiff = @(Compare-Object -ReferenceObject $expectedSortedTools -DifferenceObject $actualTools)
$toolsPass = $toolsResponse.code -eq "200" -and $toolDiff.Count -eq 0

$knowledgeQuery = [uri]::EscapeDataString((ConvertFrom-Utf8Base64 "5LiJ5pif5aCG"))
$knowledge = Invoke-RestMethod `
    -Uri "$BackendBase/api/agent/knowledge/search?query=$knowledgeQuery&limit=1" `
    -Method Get

$aiChatPage = Invoke-WebRequest -Uri "$FrontendBase/ai-chat" -Method Get -UseBasicParsing

$results | Format-Table -AutoSize
$negativeRouteResults | Format-Table -AutoSize
$contextRouteResults | Format-Table -AutoSize
$attachmentResult | Format-Table -AutoSize
$markdownAttachmentResult | Format-Table -AutoSize
$docxAttachmentResult | Format-Table -AutoSize

$knowledgePass = $knowledge.code -eq "200" -and $knowledge.data.documents.Count -ge 1 -and
    -not [string]::IsNullOrWhiteSpace($knowledge.data.documents[0].obsidianUri)
$pagePass = $aiChatPage.StatusCode -eq 200 -and $aiChatPage.Content.Contains('id="app"')
$routePass = -not ($results | Where-Object { -not $_.Pass })
$negativeRoutePass = -not ($negativeRouteResults | Where-Object { -not $_.Pass })
$contextRoutePass = -not ($contextRouteResults | Where-Object { -not $_.Pass })
$attachmentPass = $attachmentResult.Pass
$markdownAttachmentPass = $markdownAttachmentResult.Pass
$docxAttachmentPass = $docxAttachmentResult.Pass

Write-Host ""
Write-Host "Knowledge search:" $(if ($knowledgePass) { "PASS" } else { "FAIL" })
Write-Host "AI chat page:" $(if ($pagePass) { "PASS" } else { "FAIL" })
Write-Host "Negative route guards:" $(if ($negativeRoutePass) { "PASS" } else { "FAIL" })
Write-Host "Context route memory:" $(if ($contextRoutePass) { "PASS" } else { "FAIL" })
Write-Host "Attachment route:" $(if ($attachmentPass) { "PASS" } else { "FAIL" })
Write-Host "Markdown attachment route:" $(if ($markdownAttachmentPass) { "PASS" } else { "FAIL" })
Write-Host "DOCX attachment route:" $(if ($docxAttachmentPass) { "PASS" } else { "FAIL" })
Write-Host "Tool registry:" $(if ($toolsPass) { "PASS" } else { "FAIL: $($actualTools -join ', ')" })

if (-not ($routePass -and $negativeRoutePass -and $contextRoutePass -and $attachmentPass -and $markdownAttachmentPass -and $docxAttachmentPass -and $toolsPass -and $knowledgePass -and $pagePass)) {
    exit 1
}

Write-Host "Agent demo regression: PASS"
