const passwordResetTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	
	<head>
		<meta charset="UTF-8">
		<title>Password Reset Email</title>
		<style>
			body {
				background-color: #ffffff;
				font-family: Arial, sans-serif;
				font-size: 16px;
				line-height: 1.4;
				color: #333333;
				margin: 0;
				padding: 0;
			}
	
			.container {
				max-width: 600px;
				margin: 0 auto;
				padding: 0 20px;
				text-align: center;
			}
	
			.logo {
				max-width: 200px;
				margin-bottom: 20px;
			}

			img{
				mix-blend-mode: color-burn;
				border-radius:50%;
			}

			.message {
				font-size: 18px;
				font-weight: bold;
				margin-bottom: 20px;
				color: #e74c3c;
			}
	
			.body {
				font-size: 16px;
				margin-bottom: 20px;
			}
	
			.otp-box {
				background-color: #f8f9fa;
				border: 2px dashed #FFD60A;
				border-radius: 8px;
				padding: 20px;
				margin: 20px 0;
				font-size: 24px;
				font-weight: bold;
				color: #333;
				letter-spacing: 3px;
			}
	
			.warning {
				background-color: #fff3cd;
				border: 1px solid #ffeaa7;
				border-radius: 5px;
				padding: 15px;
				margin: 20px 0;
				color: #856404;
			}
	
			.support {
				font-size: 14px;
				color: #999999;
				margin-top: 20px;
			}
	
			.highlight {
				font-weight: bold;
			}
		</style>
	
	</head>
	
	<body>
		<div class="container">
			<img class="logo" src="https://drive.google.com/file/d/1is5g1YgkQgZLXe7lxA777RWaQ56Aguvz/view?usp=drive_link" width="50" height="50" alt="Logo">
			<div class="message">🔐 Password Reset Request</div>
			<div class="body">
				<p>Dear User,</p>
				<p>We received a request to reset your password. Use the following OTP (One-Time Password) to reset your password:</p>
				
				<div class="otp-box">
					${otp}
				</div>
				
				<div class="warning">
					<strong>⚠️ Security Notice:</strong><br>
					• This OTP is valid for 10 minutes only<br>
					• Don't share this OTP with anyone<br>
					• If you didn't request this reset, please ignore this email
				</div>
				
				<p>Once you verify this OTP, you'll be able to set a new password for your account.</p>
			</div>
			<div class="support">
				If you have any questions or need assistance, please feel free to reach out to us at 
				<a href="mailto:support@yourplatform.com">support@yourplatform.com</a>. We are here to help!
			</div>
		</div>
	</body>
	
	</html>`;
};

module.exports = passwordResetTemplate;