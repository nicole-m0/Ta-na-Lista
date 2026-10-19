Add-Type -AssemblyName System.Drawing
$taskAssets = Join-Path $PSScriptRoot '..\assets'
foreach ($taskFile in @('icon.png', 'adaptive-icon.png')) {
  $taskBitmap = New-Object System.Drawing.Bitmap 1024,1024
  $taskGraphics = [System.Drawing.Graphics]::FromImage($taskBitmap)
  $taskGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $taskGreen = [System.Drawing.ColorTranslator]::FromHtml('#21834B')
  if ($taskFile -eq 'icon.png') { $taskGraphics.Clear($taskGreen) } else { $taskGraphics.Clear([System.Drawing.Color]::Transparent) }
  $taskBrush = New-Object System.Drawing.SolidBrush $taskGreen
  $taskWhitePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White),44
  $taskWhitePen.StartCap = 'Round'
  $taskWhitePen.EndCap = 'Round'
  $taskGraphics.DrawArc($taskWhitePen,402,200,220,220,180,180)
  $taskGraphics.DrawLine($taskWhitePen,402,310,402,390)
  $taskGraphics.DrawLine($taskWhitePen,622,310,622,390)
  $taskPoints = [System.Drawing.Point[]]@([System.Drawing.Point]::new(302,357),[System.Drawing.Point]::new(722,357),[System.Drawing.Point]::new(762,778),[System.Drawing.Point]::new(262,778))
  $taskGraphics.FillPolygon([System.Drawing.Brushes]::White,$taskPoints)
  $taskPen = New-Object System.Drawing.Pen $taskGreen,30
  $taskPen.StartCap = 'Round'
  $taskPen.EndCap = 'Round'
  $taskPen.LineJoin = 'Round'
  foreach ($taskY in @(550,668)) {
    $taskGraphics.DrawLines($taskPen, [System.Drawing.Point[]]@([System.Drawing.Point]::new(366,$taskY),[System.Drawing.Point]::new(400,($taskY+34)),[System.Drawing.Point]::new(458,($taskY-31))))
    $taskGraphics.DrawLine($taskPen,519,($taskY+8),642,($taskY+8))
  }
  $taskBitmap.Save((Join-Path $taskAssets $taskFile),[System.Drawing.Imaging.ImageFormat]::Png)
  $taskPen.Dispose(); $taskWhitePen.Dispose(); $taskBrush.Dispose(); $taskGraphics.Dispose(); $taskBitmap.Dispose()
}
