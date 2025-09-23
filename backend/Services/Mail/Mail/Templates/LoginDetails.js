const loginDetailsTemplate = (username, password) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Login Information</title>
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

            img {
                mix-blend-mode: color-burn;
                border-radius: 50%;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .cta {
                display: inline-block;
                padding: 10px 20px;
                background-color: #FFD60A;
                color: #000000;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
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
            <img class="logo" src="https://drive.google.com/file/d/1is5g1YgkQgZLXe7lxA777RWaQ56Aguvz/view?usp=drive_link" width="50" height="50" alt="IET Logo">
            <div class="message">Your Login Information</div>
            <div class="body">
                <p>Dear Student,</p>
                <p>Welcome to our platform! Below are your login credentials:</p>
                <p><span class="highlight">Username:</span> ${username}</p>
                <p><span class="highlight">Password:</span> ${password}</p>
                <p>We recommend you change your password after your first login for security reasons.</p>
                <p>To access the platform, please <a href="https://yourplatform.com/login" class="cta">Log In Here</a>.</p>
            </div>
            <div class="support">
                If you have any questions or need assistance, feel free to reach out to us at <a href="mailto:support@yourplatform.com">support@yourplatform.com</a>. We are here to help!
            </div>
        </div>
    </body>
    
    </html>`;
};

module.exports = loginDetailsTemplate;
