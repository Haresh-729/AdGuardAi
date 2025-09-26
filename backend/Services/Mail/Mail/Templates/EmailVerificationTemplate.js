const otpTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	
	<head>
		<meta charset="UTF-8">
		<title>OTP Verification Email</title>
		<style>
			body {
				background: #111111;
				font-family: 'Manrope', 'ui-sans-serif', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
				font-size: 16px;
				line-height: 1.6;
				color: #ffffff;
				margin: 0;
				padding: 20px;
				min-height: 100vh;
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
				position: relative;
			}

			.header::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
				opacity: 0.3;
			}

			.logo {
				width: 80px;
				height: 80px;
				border-radius: 12px;
				background: #4225A6;
				margin: 0 auto 15px;
				display: flex;
				align-items: center;
				justify-content: center;
				backdrop-filter: blur(10px);
				position: relative;
				z-index: 1;
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.logo-text {
				color: #ffffff;
				font-size: 14px;
				font-weight: 600;
				font-family: 'Varela Round', 'Manrope', sans-serif;
			}

			.brand-name {
				color: #ffffff;
				font-size: 28px;
				font-weight: 500;
				font-family: 'Varela Round', 'Manrope', sans-serif;
				margin: 0;
				text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
				position: relative;
				z-index: 1;
			}

			.content {
				padding: 40px 30px;
				text-align: center;
			}

			.message {
				font-size: 32px;
				font-weight: 500;
				margin-bottom: 20px;
				color: #4225A6;
				font-family: 'Varela Round', 'Manrope', sans-serif;
			}

			.body {
				font-size: 16px;
				margin-bottom: 30px;
				color: #cfcfcf;
				line-height: 1.7;
			}

			.body p {
				margin-bottom: 16px;
			}

			.otp-container {
				background: #1a1a1a;
				border: 2px solid #4225A6;
				border-radius: 16px;
				padding: 25px;
				margin: 30px 0;
				position: relative;
				overflow: hidden;
			}

			.otp-container::before {
				content: '';
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(90deg, transparent, rgba(66, 37, 166, 0.1), transparent);
				animation: shimmer 2s infinite;
			}

			@keyframes shimmer {
				0% { left: -100%; }
				100% { left: 100%; }
			}

			.otp-label {
				font-size: 14px;
				color: #4225A6;
				margin-bottom: 10px;
				text-transform: uppercase;
				letter-spacing: 1px;
				font-weight: 600;
			}

			.otp-code {
				font-size: 36px;
				font-weight: 700;
				color: #ffffff;
				letter-spacing: 8px;
				font-family: 'Courier New', monospace;
				margin: 0;
				text-shadow: 0 0 10px rgba(66, 37, 166, 0.3);
				position: relative;
				z-index: 1;
			}

			.validity {
				background: rgba(233, 53, 115, 0.1);
				border: 1px solid rgba(233, 53, 115, 0.3);
				border-radius: 12px;
				padding: 15px;
				margin: 25px 0;
				color: #E93573;
				font-size: 14px;
				font-weight: 500;
			}

			.security-note {
				background: rgba(66, 37, 166, 0.05);
				border: 1px solid rgba(66, 37, 166, 0.2);
				border-radius: 12px;
				padding: 20px;
				margin: 25px 0;
				color: #cfcfcf;
				font-size: 14px;
				line-height: 1.6;
			}

			.security-icon {
				color: #4225A6;
				font-size: 18px;
				margin-right: 8px;
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

			.divider {
				height: 1px;
				background: linear-gradient(90deg, transparent, #2a2a2a, transparent);
				margin: 20px 0;
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
				
				.otp-code {
					font-size: 28px;
					letter-spacing: 4px;
				}
				
				.message {
					font-size: 28px;
				}
			}
		</style>
	</head>

	<body>
		<div class="container">
			<!-- Header with logo and brand -->
			<div class="header">
				<div class="logo">
					<div class="logo-text">AG</div>
				</div>
				<h1 class="brand-name">AdGuard AI</h1>
			</div>

			<!-- Main content -->
			<div class="content">
				<div class="message">Verification Required</div>
				
				<div class="body">
					<p>Hello there!</p>
					<p>Thank you for choosing AdGuard AI. To complete your account verification, please use the one-time password (OTP) below:</p>
				</div>

				<!-- OTP Display -->
				<div class="otp-container">
					<div class="otp-label">Your Verification Code</div>
					<div class="otp-code">${otp}</div>
				</div>

				<!-- Validity notice -->
				<div class="validity">
					⏰ This verification code expires in <strong>10 minutes</strong>
				</div>

				<!-- Security note -->
				<div class="security-note">
					<span class="security-icon">🛡️</span>
					<strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code via phone, email, or any other medium.
				</div>

				<div class="divider"></div>

				<div class="body">
					<p>If you didn't request this verification code, please ignore this email or contact our support team immediately.</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="footer">
				<div class="support">
					Need help? Contact us at <a href="mailto:hello@adguard.ai">hello@adguard.ai</a>
					<br>
					We're here to assist you with ad compliance checks
				</div>
			</div>
		</div>
	</body>

	</html>`;
};

module.exports = otpTemplate;