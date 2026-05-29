param(
  [string]$BaseUrl = 'http://localhost:4000/api/v1',
  [string]$Email = 'superadmin@yourapp.com',
  [string]$Password = 'StrongPass123!'
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

$null = Invoke-Test -Name 'login' -Method 'POST' -Path '/auth/login' -Body @{ email=$Email; password=$Password }

$null = Invoke-Test -Name 'isUp' -Method 'GET' -Path '/super-admin' -Body $null
$doctors = Invoke-Test -Name 'getAllDoctors' -Method 'GET' -Path '/super-admin/doctors?page=1&limit=10' -Body $null
$patients = Invoke-Test -Name 'getAllPatients' -Method 'GET' -Path '/super-admin/patients?page=1&limit=10' -Body $null
$null = Invoke-Test -Name 'getAllVisits' -Method 'GET' -Path '/super-admin/visits?page=1&limit=10' -Body $null
$clinics = Invoke-Test -Name 'getAllClinics' -Method 'GET' -Path '/super-admin/clinics' -Body $null
$null = Invoke-Test -Name 'getManagedPatients' -Method 'GET' -Path '/super-admin/managed-patients?page=1&limit=10' -Body $null
$null = Invoke-Test -Name 'getManagedVisits' -Method 'GET' -Path '/super-admin/managed-visits?page=1&limit=10' -Body $null

$firstDoctorId = $null
$firstPatientId = $null
$firstPatientSSN = '30201011230002'
$firstClinicId = $null

if ($doctors -and $doctors.items -and $doctors.items.Count -gt 0) {
  $firstDoctorId = [string]$doctors.items[0].id
}

if ($patients -and $patients.items -and $patients.items.Count -gt 0) {
  $firstPatientId = [string]$patients.items[0].id
  if ($patients.items[0].user -and $patients.items[0].user.socialSecurityNumber) {
    $firstPatientSSN = [string]$patients.items[0].user.socialSecurityNumber
  }
}

if ($clinics) {
  if ($clinics.items -and $clinics.items.Count -gt 0) {
    $firstClinicId = [string]$clinics.items[0].id
  } elseif ($clinics.Count -gt 0) {
    $firstClinicId = [string]$clinics[0].id
  }
}

$null = Invoke-Test -Name 'searchPatientBySSN' -Method 'GET' -Path ('/super-admin/patient-search/' + $firstPatientSSN) -Body $null

if ($firstPatientId) {
  $null = Invoke-Test -Name 'getPatientById' -Method 'GET' -Path ('/super-admin/patient/' + $firstPatientId) -Body $null
  $null = Invoke-Test -Name 'updatePatient' -Method 'PATCH' -Path ('/super-admin/patient/' + $firstPatientId) -Body @{}
  $null = Invoke-Test -Name 'getPatientVisits' -Method 'GET' -Path ('/super-admin/patient/' + $firstPatientId + '/visits') -Body $null
  $null = Invoke-Test -Name 'getPatientMedications' -Method 'GET' -Path ('/super-admin/patient/' + $firstPatientId + '/medications') -Body $null
  $null = Invoke-Test -Name 'getPatientScans' -Method 'GET' -Path ('/super-admin/patient/' + $firstPatientId + '/scans') -Body $null
  $null = Invoke-Test -Name 'getPatientLabs' -Method 'GET' -Path ('/super-admin/patient/' + $firstPatientId + '/labs') -Body $null
}

if ($firstDoctorId) {
  $null = Invoke-Test -Name 'getDoctorById' -Method 'GET' -Path ('/super-admin/doctor/' + $firstDoctorId) -Body $null
  $null = Invoke-Test -Name 'updateDoctor' -Method 'PATCH' -Path ('/super-admin/doctor/' + $firstDoctorId) -Body @{}
}

if ($firstClinicId) {
  $null = Invoke-Test -Name 'getClinicVisits' -Method 'GET' -Path ('/super-admin/clinic/' + $firstClinicId + '/visits?page=1&limit=10') -Body $null
  $null = Invoke-Test -Name 'getClinicDoctors' -Method 'GET' -Path ('/super-admin/clinic/' + $firstClinicId + '/doctors?page=1&limit=10') -Body $null
  $null = Invoke-Test -Name 'getClinicPatients' -Method 'GET' -Path ('/super-admin/clinic/' + $firstClinicId + '/patients?page=1&limit=10') -Body $null
}

$null = Invoke-Test -Name 'createClinic' -Method 'POST' -Path '/super-admin/clinic' -Body @{ name='SmokeTest Clinic'; speciality='General' }

if ($firstPatientId) {
  $null = Invoke-Test -Name 'createVisit' -Method 'POST' -Path '/super-admin/visit' -Body @{ patientId=$firstPatientId; diagnoses='smoke-test diagnosis' }
  $null = Invoke-Test -Name 'createMedication' -Method 'POST' -Path '/super-admin/medication' -Body @{ patientId=$firstPatientId; name='Panadol'; dosage='2'; period='7'; comments='smoke-test comment' }
}

$results = $results | Sort-Object Name
$results | Format-Table -AutoSize
$results | ConvertTo-Json -Depth 5 | Set-Content -Path '.\scratch\superadmin_smoke_results.json'
Write-Host "\nSaved raw results to scratch/superadmin_smoke_results.json"