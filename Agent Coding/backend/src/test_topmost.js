import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

async function run() {
  const tempScriptPath = join(process.env.TEMP, 'test_topmost.ps1');
  const tempResultPath = join(process.env.TEMP, 'test_topmost_res.txt');

  if (existsSync(tempResultPath)) unlinkSync(tempResultPath);

  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$f = New-Object System.Windows.Forms.FolderBrowserDialog
$f.Description = "Select Workspace Folder for Zero Coding Agent"
$f.ShowNewFolderButton = $true
$result = $f.ShowDialog($form)
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [System.IO.File]::WriteAllText("${tempResultPath.replace(/\\/g, '\\\\')}", $f.SelectedPath)
} else {
    [System.IO.File]::WriteAllText("${tempResultPath.replace(/\\/g, '\\\\')}", "CANCELLED")
}
`;

  writeFileSync(tempScriptPath, psScript, 'utf8');

  try {
    // Run it with -WindowStyle Hidden to see if the GUI still pops up topmost!
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \\"${tempScriptPath}\\"' -WindowStyle Hidden -Wait"`;
    console.log('Spawning dialog...');
    await execAsync(cmd);
    
    if (existsSync(tempResultPath)) {
      const content = readFileSync(tempResultPath, 'utf8').trim();
      console.log('Result:', content);
      unlinkSync(tempResultPath);
    } else {
      console.log('No result file.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (existsSync(tempScriptPath)) unlinkSync(tempScriptPath);
  }
}

run();
