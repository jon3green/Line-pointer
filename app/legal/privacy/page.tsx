/* eslint-disable react/no-unescaped-entities */

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-green max-w-none">
          <p className="text-gray-400 mb-6">Last Updated: November 7, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              LinePointer ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Email address, username, password (encrypted), and display name</li>
              <li><strong>Profile Information:</strong> Optional information you choose to add to your profile</li>
              <li><strong>User Content:</strong> Shared parlays, comments, favorites, and other content you create</li>
              <li><strong>Payment Information:</strong> Payment details processed through Stripe (we do not store full credit card numbers)</li>
              <li><strong>Communications:</strong> Messages you send us for support or feedback</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Information Automatically Collected</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, clicks, and interactions</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to track activity and store preferences</li>
              <li><strong>Log Data:</strong> Server logs including IP address, browser type, pages visited, timestamps</li>
              <li><strong>Performance Data:</strong> App performance metrics, error logs, crash reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Create and manage your account</li>
              <li>Process transactions and send transaction notifications</li>
              <li>Send you alerts, updates, and recommendations based on your preferences</li>
              <li>Personalize your experience and provide content tailored to you</li>
              <li>Respond to your comments, questions, and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues, fraud, and security threats</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-300 mb-4">We do not sell your personal information. We may share your information with:</p>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.1 Service Providers</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Vercel:</strong> Hosting and infrastructure</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>SendGrid:</strong> Email delivery</li>
              <li><strong>Sentry:</strong> Error tracking and monitoring</li>
              <li><strong>Analytics Providers:</strong> Usage analytics and insights</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 Public Information</h3>
            <p className="text-gray-300 mb-4">
              Information you choose to make public (such as shared parlays, comments, and profile information) may be 
              visible to other users of the Service.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.3 Legal Requirements</h3>
            <p className="text-gray-300 mb-4">
              We may disclose your information if required by law, subpoena, or court order, or to protect our rights, 
              property, or safety, or that of others.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.4 Business Transfers</h3>
            <p className="text-gray-300 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Passwords are hashed using industry-standard encryption (bcrypt)</li>
              <li>Data transmission is encrypted using SSL/TLS</li>
              <li>Database access is restricted and monitored</li>
              <li>Regular security audits and updates</li>
              <li>Limited employee access to personal data</li>
            </ul>
            <p className="text-gray-300 mb-4">
              However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot 
              guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correct:</strong> Update or correct inaccurate information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Request a portable copy of your data</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Object:</strong> Object to certain processing of your data</li>
              <li><strong>Restrict:</strong> Request restriction of processing</li>
            </ul>
            <p className="text-gray-300 mb-4">
              To exercise these rights, please contact us at privacy@linepointer.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-300 mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Keep you signed in</li>
              <li>Understand how you use our Service</li>
              <li>Improve our Service and user experience</li>
              <li>Provide personalized content</li>
            </ul>
            <p className="text-gray-300 mb-4">
              You can control cookies through your browser settings, but disabling cookies may limit some features of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
            <p className="text-gray-300 mb-4">
              We retain your personal data for as long as necessary to provide the Service and fulfill the purposes 
              described in this Privacy Policy. When you delete your account, we will delete or anonymize your personal 
              data within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
            <p className="text-gray-300 mb-4">
              Our Service is not intended for users under 18 years of age (or the legal gambling age in your jurisdiction). 
              We do not knowingly collect personal information from children. If you become aware that a child has provided 
              us with personal data, please contact us, and we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-gray-300 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have different data protection laws. By using our Service, you consent to the transfer 
              of your information to these countries.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">11. Third-Party Links</h2>
            <p className="text-gray-300 mb-4">
              Our Service may contain links to third-party websites, services, or sportsbooks. We are not responsible for 
              the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">12. California Privacy Rights</h2>
            <p className="text-gray-300 mb-4">
              California residents have additional rights under the California Consumer Privacy Act (CCPA), including:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of sale of personal information (we do not sell personal information)</li>
              <li>Right to deletion</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">13. GDPR Rights (European Users)</h2>
            <p className="text-gray-300 mb-4">
              If you are in the European Economic Area (EEA), you have additional rights under the General Data Protection 
              Regulation (GDPR), including rights to access, rectification, erasure, restriction, data portability, and 
              objection to processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">14. Changes to Privacy Policy</h2>
            <p className="text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
              the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this 
              Privacy Policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">15. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="text-gray-300 mb-4">
              Email: privacy@linepointer.com<br />
              Website: https://line-pointer.vercel.app<br />
              Data Protection Officer: privacy@linepointer.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">16. Consent</h2>
            <p className="text-gray-300 mb-4">
              By using our Service, you consent to this Privacy Policy and our Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

