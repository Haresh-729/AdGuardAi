const passwordResetTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	
	<head>
		<meta charset="UTF-8">
		<title>Password Reset Email</title>
		<style>
			body {
				background: #111111;
				font-family: 'Manrope', 'ui-sans-serif', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
				font-size: 16px;
				line-height: 1.6;
				color: #ffffff;
				margin: 0;
				padding: 20px;
			}
	
			.container {
				max-width: 600px;
				margin: 0 auto;
				background: #1e1e1e;
				border-radius: 20px;
				border: 1px solid #2a2a2a;
				box-shadow: 0 20px 40px rgba(255, 255, 255, 0.05);
				overflow: hidden;
			}

			.header {
				background: linear-gradient(135deg, #4225A6 0%, #5a39d3 100%);
				padding: 30px 20px;
				text-align: center;
			}

			.logo {
				width: 60px;
				height: 60px;
				border-radius: 12px;
				background: #4225A6;
				margin: 0 auto 15px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: #ffffff;
				font-size: 12px;
				font-weight: 600;
				font-family: 'Varela Round', 'Manrope', sans-serif;
			}

			.brand-name {
				color: #ffffff;
				font-size: 24px;
				font-weight: 500;
				font-family: 'Varela Round', 'Manrope', sans-serif;
				margin: 0;
			}

			.content {
				padding: 40px 30px;
				text-align: center;
			}

			.message {
				font-size: 28px;
				font-weight: 500;
				margin-bottom: 20px;
				color: #4225A6;
				font-family: 'Varela Round', 'Manrope', sans-serif;
			}
	
			.body {
				font-size: 16px;
				margin-bottom: 20px;
				color: #cfcfcf;
				line-height: 1.7;
			}

			.body p {
				margin-bottom: 16px;
			}
	
			.otp-box {
				background: #1a1a1a;
				border: 2px solid #4225A6;
				border-radius: 16px;
				padding: 25px;
				margin: 30px 0;
				font-size: 36px;
				font-weight: 700;
				color: #ffffff;
				letter-spacing: 8px;
				font-family: 'Courier New', monospace;
			}
	
			.warning {
				background: rgba(233, 53, 115, 0.1);
				border: 1px solid rgba(233, 53, 115, 0.3);
				border-radius: 12px;
				padding: 20px;
				margin: 25px 0;
				color: #E93573;
				font-size: 14px;
				text-align: left;
			}

			.footer {
				background: #0a0a0a;
				padding: 25px 30px;
				text-align: center;
				border-top: 1px solid #2a2a2a;
			}
	
			.support {
				font-size: 14px;
				color: #cfcfcf;
				line-height: 1.6;
			}

			.support a {
				color: #4225A6;
				text-decoration: none;
				font-weight: 600;
			}

			.support a:hover {
				text-decoration: underline;
			}
	
			.highlight {
				font-weight: 600;
			}

			/* Responsive */
			@media (max-width: 600px) {
				.container {
					margin: 10px;
					border-radius: 15px;
				}
				
				.content {
					padding: 30px 20px;
				}
				
				.otp-box {
					font-size: 28px;
					letter-spacing: 4px;
				}
				
				.message {
					font-size: 24px;
				}
			}
		</style>
	
	</head>
	
	<body>
		<div class="container">
			<div class="header">
				<div class="logo">AG</div>
				<h1 class="brand-name">AdGuard AI</h1>
			</div>

			<div class="content">
				<div class="message">🔐 Password Reset Request</div>
				<div class="body">
					<p>Dear User,</p>
					<p>We received a request to reset your password. Use the following OTP (One-Time Password) to reset your password:</p>
					
					<div class="otp-box">
						${otp}
					</div>
					
					<div class="warning">
						<strong>⚠️ Security Notice:</strong><br>
						• This OTP is valid for <span class="highlight">10 minutes</span> only<br>
						• Don't share this OTP with anyone<br>
						• If you didn't request this reset, please ignore this email
					</div>
					
					<p>Once you verify this OTP, you'll be able to set a new password for your account.</p>
				</div>
			</div>

			<div class="footer">
				<div class="support">
					If you have any questions or need assistance, please feel free to reach out to us at 
					<a href="mailto:hello@adguard.ai">hello@adguard.ai</a>. We are here to help!
				</div>
			</div>
		</div>
	</body>
	
	</html>`;
};

module.exports = passwordResetTemplate;