param(
  [string]$BaseUrl = 'http://localhost:4000/api/v1',
  [string]$Email = 'superadmin@yourapp.com',
  [string]$Password = 'StrongPass123!',
  [string]$ImagePath = ''
)

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param([string]$Name,[string]$Method,[string]$Path,[int]$Status,[string]$Info)
  $results.Add([pscustomobject]@{ Name=$Name; Method=$Method; Path=$Path; Status=$Status; Info=$Info }) | Out-Null
}

function Get-ErrorDetails {
  param([object]$ErrorRecord)
  $status = 0
  $message = $ErrorRecord.Exception.Message

  if ($ErrorRecord.Exception.Response) {
    try { $status = [int]$ErrorRecord.Exception.Response.StatusCode } catch {}
    try {
      if ($ErrorRecord.Exception.Response.Content) {
        $body = $ErrorRecord.Exception.Response.Content.ReadAsStringAsync().Result
        if (-not [string]::IsNullOrWhiteSpace($body)) { $message = $body }
      }
    } catch {}
  }

  return @($status, ($message -replace "`r|`n", ' '))
}

function Invoke-Test {
  param([string]$Name,[string]$Method,[string]$Path,[object]$Body)
  try {
    if ($null -ne $Body) {
      $json = $Body | ConvertTo-Json -Depth 10
      $response = Invoke-WebRequest -Uri ($BaseUrl + $Path) -Method $Method -WebSession $session -ContentType 'application/json' -Body $json -ErrorAction Stop
    } else {
      $response = Invoke-WebRequest -Uri ($BaseUrl + $Path) -Method $Method -WebSession $session -ErrorAction Stop
    }

    Add-Result -Name $Name -Method $Method -Path $Path -Status ([int]$response.StatusCode) -Info 'OK'
    if ([string]::IsNullOrWhiteSpace($response.Content)) { return $null }
    try { return ($response.Content | ConvertFrom-Json -ErrorAction Stop) } catch { return $response.Content }
  }
  catch {
    $details = Get-ErrorDetails -ErrorRecord $_
    Add-Result -Name $Name -Method $Method -Path $Path -Status $details[0] -Info $details[1]
    return $null
  }
}

function Invoke-MultipartTest {
  param([string]$Name,[string]$Path,[hashtable]$FormData)
  try {
    $response = Invoke-WebRequest -Uri ($BaseUrl + $Path) -Method POST -WebSession $session -Form $FormData -ErrorAction Stop
    Add-Result -Name $Name -Method 'POST' -Path $Path -Status ([int]$response.StatusCode) -Info 'OK'
    return $true
  }
  catch {
    $details = Get-ErrorDetails -ErrorRecord $_
    Add-Result -Name $Name -Method 'POST' -Path $Path -Status $details[0] -Info $details[1]
    return $false
  }
}

$null = Invoke-Test -Name 'login' -Method 'POST' -Path '/auth/login' -Body @{ email=$Email; password=$Password }

$null = Invoke-Test -Name 'isUp' -Method 'GET' -Path '/super-admin' -Body $null
$clinics = Invoke-Test -Name 'getAllClinics' -Method 'GET' -Path '/super-admin/clinics' -Body $null
$null = Invoke-Test -Name 'getAllDoctors' -Method 'GET' -Path '/super-admin/doctors?page=1&limit=10' -Body $null
$null = Invoke-Test -Name 'getAllPatients' -Method 'GET' -Path '/super-admin/patients?page=1&limit=10' -Body $null
$null = Invoke-Test -Name 'getAllVisits' -Method 'GET' -Path '/super-admin/visits?page=1&limit=10' -Body $null
$null = Invoke-Test -Name 'getManagedPatients' -Method 'GET' -Path '/super-admin/managed-patients?page=1&limit=10' -Body $null
$null = Invoke-Test -Name 'getManagedVisits' -Method 'GET' -Path '/super-admin/managed-visits?page=1&limit=10' -Body $null

$clinicId = $null
if ($clinics) {
  if ($clinics.items -and $clinics.items.Count -gt 0) { $clinicId = [string]$clinics.items[0].id }
  elseif ($clinics.Count -gt 0) { $clinicId = [string]$clinics[0].id }
}

if (-not $clinicId) {
  $createdClinic = Invoke-Test -Name 'createClinic' -Method 'POST' -Path '/super-admin/clinic' -Body @{ name='Smoke Primary Clinic'; speciality='General' }
  if ($createdClinic -and $createdClinic.id) { $clinicId = [string]$createdClinic.id }
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$doctorEmail = "doctor.$stamp@test.local"
$doctorPhone = '+20100111' + ($stamp.ToString().Substring(($stamp.ToString().Length - 4)))
$seed = [int]($stamp % 10000000)
$doctorTail = '{0:D7}' -f $seed
$patientTail = '{0:D7}' -f (($seed + 1) % 10000000)
$doctorSSN = "3020101$doctorTail"
$patientSSN = "3020101$patientTail"

$createdDoctor = $null
if ($clinicId) {
  $createdDoctor = Invoke-Test -Name 'createDoctor' -Method 'POST' -Path '/auth/doctor/create' -Body @{
    firstName = 'Api'
    lastName = 'Doctor'
    socialSecurityNumber = $doctorSSN
    email = $doctorEmail
    phone = $doctorPhone
    password = 'StrongPass123!'
    speciality = 'General'
    clinicId = $clinicId
  }
}

$createdPatient = Invoke-Test -Name 'createPatient' -Method 'POST' -Path '/auth/patient/create' -Body @{
  firstName = 'Api'
  lastName = 'Patient'
  socialSecurityNumber = $patientSSN
  address = 'Test Address'
  job = 'Tester'
}

$doctorId = $null
if ($createdDoctor -and $createdDoctor.id) { $doctorId = [string]$createdDoctor.id }
$patientId = $null
if ($createdPatient -and $createdPatient.id) { $patientId = [string]$createdPatient.id }

$doctors = Invoke-Test -Name 'getAllDoctors_afterCreate' -Method 'GET' -Path '/super-admin/doctors?page=1&limit=50' -Body $null
$patients = Invoke-Test -Name 'getAllPatients_afterCreate' -Method 'GET' -Path '/super-admin/patients?page=1&limit=50' -Body $null

if (-not $doctorId -and $doctors -and $doctors.items) {
  $found = $doctors.items | Where-Object { $_.email -eq $doctorEmail } | Select-Object -First 1
  if ($found) { $doctorId = [string]$found.id }
  elseif ($doctors.items.Count -gt 0) { $doctorId = [string]$doctors.items[0].id }
}
if (-not $patientId -and $patients -and $patients.items) {
  $foundP = $patients.items | Where-Object { $_.user.socialSecurityNumber -eq [int64]$patientSSN } | Select-Object -First 1
  if ($foundP) { $patientId = [string]$foundP.id }
  elseif ($patients.items.Count -gt 0) { $patientId = [string]$patients.items[0].id }
}

if ($doctorId) {
  $null = Invoke-Test -Name 'getDoctorById' -Method 'GET' -Path ("/super-admin/doctor/$doctorId") -Body $null
  $null = Invoke-Test -Name 'updateDoctor' -Method 'PATCH' -Path ("/super-admin/doctor/$doctorId") -Body @{ firstName='ApiUpdated' }
}

if ($patientId) {
  $null = Invoke-Test -Name 'getPatientById' -Method 'GET' -Path ("/super-admin/patient/$patientId") -Body $null
  $null = Invoke-Test -Name 'updatePatient' -Method 'PATCH' -Path ("/super-admin/patient/$patientId") -Body @{ address='Updated Address' }
  $null = Invoke-Test -Name 'searchPatientBySSN' -Method 'GET' -Path ("/super-admin/patient-search/$patientSSN") -Body $null
  $null = Invoke-Test -Name 'createVisit' -Method 'POST' -Path '/super-admin/visit' -Body @{ patientId=$patientId; diagnoses='smoke visit diagnosis'; clinicId=$clinicId }
  $null = Invoke-Test -Name 'createMedication' -Method 'POST' -Path '/super-admin/medication' -Body @{ patientId=$patientId; name='Panadol'; dosage='2'; period='7'; comments='smoke medication'; clinicId=$clinicId }
  $null = Invoke-Test -Name 'getPatientVisits' -Method 'GET' -Path ("/super-admin/patient/$patientId/visits") -Body $null
  $null = Invoke-Test -Name 'getPatientMedications' -Method 'GET' -Path ("/super-admin/patient/$patientId/medications") -Body $null
  $null = Invoke-Test -Name 'getPatientScans' -Method 'GET' -Path ("/super-admin/patient/$patientId/scans") -Body $null
  $null = Invoke-Test -Name 'getPatientLabs' -Method 'GET' -Path ("/super-admin/patient/$patientId/labs") -Body $null
}

if ($clinicId) {
  $null = Invoke-Test -Name 'getClinicVisits' -Method 'GET' -Path ("/super-admin/clinic/$clinicId/visits?page=1&limit=10") -Body $null
  $null = Invoke-Test -Name 'getClinicDoctors' -Method 'GET' -Path ("/super-admin/clinic/$clinicId/doctors?page=1&limit=10") -Body $null
  $null = Invoke-Test -Name 'getClinicPatients' -Method 'GET' -Path ("/super-admin/clinic/$clinicId/patients?page=1&limit=10") -Body $null
}

if ($ImagePath -and (Test-Path $ImagePath) -and $patientId -and $clinicId) {
  $img = Get-Item $ImagePath
  $null = Invoke-MultipartTest -Name 'uploadLab_withFile' -Path '/super-admin/lab' -FormData @{ name='Lab smoke'; patientId=$patientId; clinicId=$clinicId; image=$img }
  $null = Invoke-MultipartTest -Name 'uploadScan_withFile' -Path '/super-admin/scan' -FormData @{ name='Scan smoke'; type='0'; patientId=$patientId; clinicId=$clinicId; image=$img }
} else {
  Add-Result -Name 'uploadLab_withFile' -Method 'POST' -Path '/super-admin/lab' -Status 0 -Info 'SKIPPED: pass -ImagePath and ensure patient/clinic exist'
  Add-Result -Name 'uploadScan_withFile' -Method 'POST' -Path '/super-admin/scan' -Status 0 -Info 'SKIPPED: pass -ImagePath and ensure patient/clinic exist'
}

$results = $results | Sort-Object Name
$results | Format-Table -AutoSize
$results | ConvertTo-Json -Depth 6 | Set-Content -Path '.\scratch\superadmin_full_results.json'
Write-Host "\nSaved raw results to scratch/superadmin_full_results.json"