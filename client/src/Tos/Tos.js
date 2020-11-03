import Footer from '../Footer/Footer';
import styles from './Tos.module.scss';
import React, { Component } from 'react';
import { Box, Flex, Text, Heading } from 'rimble-ui'

class Tos extends Component {
  state = {};

  render() {
    return (
      <Box>
        <Box className={styles.headerContainer} pb={[3,5]} px={[3,6]} pt={['2em', '3em']}>
          <Box className={styles.headerBgFiller}></Box>
          <Box position={'relative'} zIndex={10}>
            <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "60em"]} mx={'auto'} pb={3} textAlign={'center'} pt={['8vh', '8vh']}>
              <Heading.h1 fontFamily={'sansSerif'} lineHeight={'1.1em'} mb={'0.2em'} fontSize={['2.5em',7]} textAlign={'center'} color={'white'}>
                Terms of Service
              </Heading.h1>
              <Heading.h2 fontWeight={'400'} lineHeight={['1.4em', '2em']} fontSize={[2,3]} textAlign={'center'} color={'white'}>
                Updated: November 28, 2019
              </Heading.h2>
            </Flex>
            <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "70em"]} mx={'auto'} textAlign={'center'}>
              <Box className={styles.textContainer} alignItems={'center'} width={'100%'} minHeight={['auto','20em']} backgroundColor={'white'} color={'dark-gray'} p={[3,4]} boxShadow={'0 0 25px 5px rgba(102, 139, 255, 0.7)'} borderRadius={'15px'} style={{position:'relative'}}>
                <Box id={'first-paragraph'} pb={3}>
                  <Text pb={3}>
                    These terms of service, together with any documents and additional terms they expressly incorporate by reference (collectively, these “Terms”), are entered into between Idle Labs Inc. (“Idle,” “we,” “us” and “our”) and you or the company or other legal entity you represent (“you” or “your”), and constitute a binding legal agreement.
                  </Text>
                  <Text pb={3}>
                    Please read these Terms carefully, as these Terms govern your use of our Portal and our Services, and expressly cover your rights and obligations, and our disclaimers and limitations of legal liability, relating to such use. By accessing or using the Interface, you signify that you have read, understand, and agree to be bound by and to comply with these Terms, including the mandatory arbitration provision in Section 12. If you do not agree to these Terms, you must not access or use our Portal or the Services.
                  </Text>
                  <Text pb={3}>
                    You must be able to form a legally binding contract online either on behalf of a company or as an individual. Accordingly, you represent that: (a) if you are agreeing to these Terms on behalf of a company or other legal entity, you have the legal authority to bind the company or other legal entity to these Terms; and (b) you are at least 18 years old (or the age of majority where you reside, whichever is older), can form a legally binding contract online, and have the full, right, power and authority to enter into and to comply with the obligations under these Terms.
                  </Text>
                  <Text pb={3}>
                    In addition to the foregoing, you also represent and warrant that you are not a citizen or resident of a state, country, territory or other jurisdiction that is embargoed by the United States or where your use of the Portal or the Services would be illegal or otherwise violate any applicable law.  Specifically, you represent that you are not located in, organized in, or a resident of New York, Cuba, Iran, Syria, North Korea, the Crimea region, Venezuela, or any other jurisdiction where Applicable law prohibits you from accessing or using the Services; and you represent that you are not be named on the Office of Foreign Asset Control of the U.S. Department of the Treasury’s Specially Designated and Blocked Persons List.
                   </Text>
                  <Text>
                    Please carefully review the disclosures and disclaimers set forth in Section 9 in their entirety before using any software developed by Idle. The information in Section 9 provides important details about the legal obligations associated with your use of the Idle open-source software. By accessing or using our Portal or our Services, you agree that Idle is a provider of open-source software that optimizes the allocation of your digital assets to third-party decentralized web protocols.  Idle is not affiliated with and has no control over these third-party protocols and is not responsible for any losses that occur as a result of interconnection with these third-party protocols. The Protocol is open-source software deployed on the Ethereum Blockchain.  While Idle developed and deployed the Protocol, the software operates in an autonomous fashion on a decentralized network and, as a result, Idle has no control over user transactions. You accordingly acknowledge that you use the Services at your own risk and agree that Idle will not be responsible for any losses that occur as a result of your use of the Services.
                  </Text>
                </Box>

                <Box id={'key-definitions'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    1. KEY DEFINITIONS
                  </Heading.h3>

                  <Text py={2}>
                    For the purpose of these Terms, the following capitalized terms shall have the following meanings:
                  </Text>

                  <ul className={styles.list}>
                    <li>
                      <strong>1.1. “Affiliate”</strong> means, with respect to a party to these Terms, any legal entity that, directly or indirectly controls, is controlled by, or is under common control with such party.
                    </li>
                    <li>
                      <strong>1.2. “Applicable Law”</strong> means any domestic or foreign law, rule, statute, regulation, by-law, order, protocol, code, decree, or other directive, requirement or guideline, published or in force which applies to or is otherwise intended to govern or regulate any person, property, transaction, activity, event or other matter, including any rule, order, judgment, directive or other requirement or guideline issued by any Governmental Authority having jurisdiction over Idle, you, the Portal or the Services, or as otherwise duly enacted, enforceable by law, the common law or equity.
                    </li>
                    <li>
                      <strong>1.3. “Ether”</strong> means the Ethereum Blockchain utility token that may be used to purchase computational resources to run decentralized applications or perform actions on the Ethereum Blockchain.
                    </li>
                    <li>
                      <strong>1.4. “Ethereum Address”</strong> means the unique public key digital asset identifier that points to an Ethereum-compatible wallet to which Ether may be sent or stored.
                    </li>
                    <li>
                      <strong>1.5. “Ethereum Blockchain”</strong> means the underlying blockchain infrastructure which the Portal leverages to perform portions of the Services.
                    </li>
                    <li>
                      <strong>1.6. “Governmental Authority”</strong> includes any domestic or foreign federal, provincial or state, municipal, local or other governmental, regulatory, judicial or administrative authority.
                    </li>
                    <li>
                      <strong>1.7. “Portal”</strong> means the Idle site located at https://idle.finance and all associated sites linked thereto by Idle and its Affiliates, which includes, for certainty, Idle’s decentralized application layer on the Ethereum Blockchain.
                    </li>
                    <li>
                      <strong>1.8. “Protocol”</strong> means the Idle decentralized web protocol, which optimizes the allocation of users’ digital assets to third-party decentralized web protocols.
                    </li>
                    <li>
                      <strong>1.9. “Token”</strong> means an “ERC-20” digital asset issued on the Ethereum Blockchain.
                    </li>
                    <li>
                      <strong>1.10. “Services”</strong> has the meaning set out in Section 3.1.
                    </li>
                    <li>
                      <strong>1.11. “Third-Parties Services”</strong> means other services (such as fiat-to-token gateway, or token-to-token swap) provided by third parties services running on Ethereum Blockchain.
                    </li>
                  </ul>
                </Box>

                <Box id={'modifications-terms'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    2. MODIFICATIONS TO THESE TERMS
                  </Heading.h3>

                  <Text py={2}>
                    We reserve the right, in our sole discretion, to modify these Terms from time to time. If we make changes, we will provide you with notice of such changes, such as by sending an email, providing a notice through our Services or updating the date at the top of these Terms. Unless we say otherwise in our notice, any and all such modifications are effective immediately, and your continued use of our Services after we provide such notice will confirm your acceptance of the changes. If you do not agree to the amended Terms, you must stop using our Services.
                  </Text>
                </Box>

                <Box id={'services'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    3. SERVICES
                  </Heading.h3>
                </Box>

                <ul className={styles.list}>
                  <li>
                    <strong>3.1. Services</strong><br />
                    The primary purpose of the Portal and Protocol is to enable users to interact with smart contracts that allocate their digital assets to third-party decentralized web protocols and enable users to receive an optimized allocation of digital assets from these protocols in return (the “Services”).
                  </li>
                  <li>
                    <strong>3.2. Fees</strong><br />
                    Use of the Services is provided to you at no charge. Fees are charged on-top of Third-Parties.
                  </li>
                  <li>
                    <strong>3.3. Ethereum Gas Charges</strong><br />
                    Some Services involve the use of the Ethereum Blockchain, which may require that you pay a fee, commonly known as “Ethereum Gas Charges,” for the computational resources required to perform a transaction on the Ethereum Blockchain. You acknowledge and agree that Idle has no control over: (a) any Ethereum Blockchain transactions; (b) the method of payment of any Ethereum Gas Charges; or (c) any actual payments of Ethereum Gas Charges. Accordingly, you must ensure that you have a sufficient balance of Ether stored at your Ethereum Address to complete any transaction on the Ethereum Blockchain before initiating such Ethereum Blockchain transaction. We will make reasonable efforts to notify you of any Ethereum Gas Charges before initiating any Services that require the use of the Ethereum Blockchain.
                  </li>
                  <li>
                    <strong>3.4. Conditions and Restrictions</strong><br />
                    We may, at any time and in our sole discretion, restrict your access to, or otherwise impose conditions or restrictions upon your use of, the Services or the Portal, with or without prior notice.
                  </li>
                  <li>
                    <strong>3.5. No Broker, Legal or Fiduciary Relationship</strong><br />
                    Idle is not your broker, lawyer, intermediary, agent, or advisor and has no fiduciary relationship or obligation to you regarding any other decisions or activities that you effect when using the Portal or the Services. Neither our communications nor any information that we provide to you is intended as, or shall be considered or construed as, advice.
                  </li>
                  <li>
                    <strong>3.6. Your Responsibilities</strong><br />
                    As a condition to accessing or using the Services or the Portal, you shall:
                    <ul className={styles.list} style={{listStyle:'lower-alpha'}}>
                      <li>only use the Services and the Portal for lawful purposes and in accordance with these Terms;</li>
                      <li>ensure that, at all times, all information that you provide on the Portal is current, complete and accurate; and maintain the security and confidentiality of your Ethereum Address.</li>
                      <li>shall be responsible for payment of all applicable taxes, if any, to which the Services might be subject and any and all other taxes which may apply to you.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>3.7. Unacceptable Use or Conduct</strong><br />
                    As a condition to accessing or using the Portal or the Services, you will not:
                    <ul className={styles.list} style={{listStyle:'lower-alpha'}}>
                      <li>violate any Applicable Law, including, without limitation, any relevant and applicable anti-money laundering and anti-terrorist financing laws, such as the Bank Secrecy Act, each as may be amended;</li>
                      <li>infringe on or misappropriate any contract, intellectual property or other third-party right, or commit a tort while using the Portal or the Services;</li>
                      <li>use the Services in any manner that could interfere with, disrupt, negatively affect, or inhibit other users from fully enjoying the Services, or that could damage, disable, overburden, or impair the functioning of the Services in any manner;</li>
                      <li>attempt to circumvent any content filtering techniques or security measures that Idle employs on the Portal, or attempt to access any service or area of the Portal or the Services that you are not authorized to access;</li>
                      <li>use the Services to pay for, support, or otherwise engage in any illegal gambling activities, fraud, money-laundering, or terrorist activities, or other illegal activities;</li>
                      <li>use any robot, spider, crawler, scraper, or other automated means or interface not provided by us, to access the Services or to extract data;</li>
                      <li>introduce any malware, virus, Trojan horse, worm, logic bomb, drop-dead device, backdoor, shutdown mechanism or other harmful material into the Portal or the Services;</li>
                      <li>provide false, inaccurate, or misleading information;</li>
                      <li>post content or communications on the Portal that are, in our sole discretion, libelous, defamatory, profane, obscene, pornographic, sexually explicit, indecent, lewd, vulgar, suggestive, harassing, hateful, threatening, offensive, discriminatory, bigoted, abusive, inflammatory, fraudulent, deceptive or otherwise objectionable;</li>
                      <li>post content on the Portal containing unsolicited promotions, political campaigning, or commercial messages or any chain messages or user content designed to deceive or trick the user of the Service;</li>
                      <li>use the Portal or the Services from a jurisdiction that we have, in our sole discretion, or a relevant Governmental Authority has determined is a jurisdiction where the use of the Portal or the Services is prohibited; or</li>
                      <li>encourage or induce any third party to engage in any of the activities prohibited under this Section 3.7.</li>
                    </ul>
                  </li>

                  <li>
                    <strong>3.8. Your Assumption of Risks</strong><br />
                    You represent and warrant that you:
                    <ul className={styles.list} style={{listStyle:'lower-alpha'}}>
                      <li>have the necessary technical expertise and ability to review and evaluate the security, integrity and operation of any transactions that you engage in through the Protocol;</li>
                      <li>have the knowledge, experience, understanding, professional advice and information to make your own evaluation of the merits, risks and applicable compliance requirements under Applicable Law of engaging in transactions through the Protocol;</li>
                      <li>acknowledge and understand that the Protocol allocates your digital assets to third-party decentralized web protocols to facilitate your lending and borrowing through these third-party protocols and that Idle is not responsible or liable for these transactions or the operation of these third-party protocols;</li>
                      <li>know, understand and accept the risks associated with your Ethereum Address, the Ethereum Blockchain, Ether and Tokens; and</li>
                      <li>accept the risks associated with lending, borrowing and trading Ether and Tokens, and are responsible for conducting your own independent analysis of the risks specific to any Ether and Tokens lent, borrowed or traded by you and your use of the Services.</li>
                    </ul>
                    You hereby assume, and agree that Idle will have no responsibility or liability for, such risks. You hereby irrevocably waive, release and discharge all claims, whether known or unknown to you, against Idle, its affiliates and their respective shareholders, members, directors, officers, employees, agents and representatives related to any of the risks set forth herein.
                  </li>
                  <li>
                    <strong>3.9. Additional Representations</strong><br />
                    You represent and warrant that you:
                    <ul className={styles.list} style={{listStyle:'lower-alpha'}}>
                      <li>are not using the Protocol to engage in the leveraged, margined, or financed purchase of digital assets; and</li>
                      <li>are using the Protocol for the purpose of accessing third-party decentralized web protocols.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>3.10. Your Content</strong><br />
                    You hereby grant to us a royalty-free, fully paid-up, sublicensable, transferable, perpetual, irrevocable, non-exclusive, worldwide license to use, copy, modify, create derivative works of, display, perform, publish and distribute, in any form, medium or manner, any content that is available to other users via the Idle Platform as a result of your use of the Portal (collectively, “Your Content”) through your use of the Services or the Portal, including, without limitation, for promoting Idle (or its Affiliates), the Services or the Portal. You represent and warrant that: (a) you own Your Content or have the right to grant the rights and licenses in these Terms; and (b) Your Content and our use of Your Content, as licensed herein, does not and will not violate, misappropriate or infringe on any third party’s rights.
                  </li>
                </ul>

                <Box id={'privacy-policy'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    4. PRIVACY POLICY
                  </Heading.h3>
                  <Text py={2}>
                    Please refer to our privacy policy available at https://idle.finance/privacy-policy for information about how we collect, use, share and otherwise process information about you.
                  </Text>
                </Box>

                <Box id={'proprietary-rights'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    5. PROPRIETARY RIGHTS
                  </Heading.h3>
                  <ul className={styles.list}>
                    <li>
                      <strong>5.1. Ownership of Services; License to Services</strong><br />
                      Excluding any open source software (as further described in Section 5.2) or third-party software that the Portal or the Services incorporates, as between you and Idle, Idle owns the Portal and the Services, including all technology, content and other materials used, displayed or provided on the Portal or in connection with the Services (including all intellectual property rights subsisting therein), and hereby grants you a limited, revocable, transferable, license to access and use those portions of the Portal and the Services that are proprietary to Idle.
                    </li>
                    <li>
                      <strong>5.2. Idle License; Open Source Software License; Limitations</strong><br />
                      The Portal and the Services are governed by the most recent version of the open source license commonly known as the Apache 2.0 a copy of which (as it applies to the Portal and the Services) can be found at:  https://apache.org/licenses/LICENSE-2.0 (as of the date these Terms were last updated) and any other applicable licensing terms for the Portal and the Services in these Terms (collectively, the “Idle License”). You acknowledge that the Portal or the Services may use, incorporate or link to certain open-source components and that your use of the Portal or Services is subject to, and you will comply with any, applicable open-source licenses that govern any such open-source components (collectively, “Open-Source Licenses”). Without limiting the generality of the foregoing, you may not: (a) resell, lease, lend, share, distribute or otherwise permit any third party to use the Portal or the Services; (b) use the Portal or the Services for time-sharing or service bureau purposes; or (c) otherwise use the Portal or the Services in a manner that violates the Idle License or any other Open-Source Licenses.
                    </li>
                    <li>
                      <strong>5.3. Trademarks</strong><br />
                      Any of Idle’s product or service names, logos, and other marks used in the Portal or as a part of the Services, including Idle's name and logo are trademarks owned by Idle, its Affiliates or its applicable licensors. You may not copy, imitate or use them without Idle’s (or the applicable licensor’s) prior written consent.
                    </li>
                  </ul>
                </Box>

                <Box id={'changes-suspension-termination'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    6. CHANGES; SUSPENSION; TERMINATION
                  </Heading.h3>
                  <ul className={styles.list}>
                    <li>
                      <strong>6.1. Changes to Services</strong><br />
                      We may, at our sole discretion, from time to time and with or without prior notice to you, modify, suspend or disable, temporarily or permanently, the Services, in whole or in part, for any reason whatsoever, including, but not limited to, as a result of a security incident.
                    </li>
                    <li>
                      <strong>6.2. No Liability</strong><br />
                      We will not be liable for any losses suffered by you resulting from any modification to any Services or from any suspension or termination, for any reason, of your access to all or any portion of the Portal or the Services.
                    </li>
                    <li>
                      <strong>6.3. Survival</strong><br />
                      The following sections will survive any termination of your access to the Portal or the Services, regardless of the reasons for its expiration or termination, in addition to any other provision which by law or by its nature should survive: Sections 1, 4, 5, 6.3, and 7-14.
                    </li>
                  </ul>
                </Box>

                <Box id={'electronic-notices'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    7. ELECTRONIC NOTICES
                  </Heading.h3>
                  <Text py={2}>
                    You consent to receive all communications, agreements, documents, receipts, notices, and disclosures electronically (collectively, our “Communications”) that we provide in connection with these Terms or any Services. You agree that we may provide our Communications to you by posting them on the Portal or by emailing them to you at the email address you provide in connection with using the Services, if any. You should maintain copies of our Communications by printing a paper copy or saving an electronic copy. You may also contact our support team to request additional electronic copies of our Communications by filing a support request at info@idle.finance.
                  </Text>
                </Box>

                <Box id={'indemnification'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    8. INDEMNIFICATION
                  </Heading.h3>
                  <Text py={2}>
                    You will defend, indemnify, and hold harmless us, our Affiliates, and our and our Affiliates’ respective shareholders, members, directors, officers, employees, attorneys, agents, representatives, suppliers and contractors (collectively, “Indemnified Parties”) from any claim, demand, lawsuit, action, proceeding, investigation, liability, damage, loss, cost or expense, including without limitation reasonable attorneys’ fees, arising out of or relating to (a) your use of, or conduct in connection with, the Portal, Services or Margin Tokens; (b) Ethereum Blockchain assets associated with your Ethereum Address; (c) any feedback or user content you provide to the Portal, if any; (d) your violation of these Terms; or (e) your infringement or misappropriation of the rights of any other person or entity. If you are obligated to indemnify any Indemnified Party, Idle (or, at its discretion, the applicable Indemnified Party) will have the right, in its sole discretion, to control any action or proceeding and to determine whether Idle wishes to settle, and if so, on what terms.
                  </Text>
                </Box>

                <Box id={'disclosures-disclaimers'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    9. Disclosures; DISCLAIMERS
                  </Heading.h3>
                  <Text py={2}>
                    Idle is a developer of open-source software. Idle does not operate a digital asset exchange platform or execute peer-to-peer transactions through its Protocol and therefore has no oversight, involvement, or control with respect to your transactions, which are executed through third-party protocols and the Ethereum Blockchain.  The Protocol is an autonomous decentralized web protocol deployed to the Ethereum Blockchain that operates in a disintermediated fashion, and, as such, Idle does not participate in any of these transactions.  In each instance, when you interact with the Protocol, you are interacting with a smart contract that transfers your digital assets to a third-party protocol.
                  </Text>
                  <Text py={2}>
                    [Under U.S. federal law, unless you are an “eligible contract participant” as defined in 7 U.S.C. § 1a(18), your transaction must settle within 28 days. Individuals who do not have more than $10 million invested on a discretionary basis (or $5 million if the transaction is for the purpose of managing risk associated with an asset owned or liability incurred, or reasonably likely to be owned or incurred) are not eligible contract participants and may not enter into transactions using the Idle open-source software that do not result in actual delivery of digital assets within 28 days.]
                  </Text>
                  <Text py={2}>
                    You are responsible for complying with all laws and regulations applicable to your transactions, including, but not limited to, the Commodity Exchange Act and the regulations promulgated thereunder by the U.S. Commodity Futures Trading Commission (“CFTC”), and the federal securities laws and the regulations promulgated thereunder by the U.S. Securities and Exchange Commission (“SEC”).
                  </Text>
                  <Text py={2}>
                    You understand that Idle is not registered or licensed by the CFTC, SEC, the Financial Crimes Enforcement Network or any financial regulatory authority. No financial regulatory authority has reviewed or approved the use of the Idle open-source software. This website and the Idle open-source software do not constitute advice or a recommendation concerning any commodity, security or other asset. Idle is not acting as an investment adviser or commodity trading adviser to any person.
                  </Text>
                  <Text py={2}>
                    Idle does not own or control the underlying software protocols that enable the Protocol to function. In general, the underlying protocols are open-source and anyone can use, copy, modify, and distribute them. Idle is not responsible for operation of the underlying protocols, and Idle makes no guarantee of their functionality, security, or availability.
                  </Text>
                  <Text py={2}>
                    To the maximum extent permitted under Applicable Law, the Portal and the Services (and any of their content or functionality) provided by or on behalf of us are provided on an “AS IS” and “AS AVAILABLE” basis, and we expressly disclaim, and you hereby waive, any representations, conditions or warranties of any kind, whether express or implied, legal, statutory or otherwise, or arising from statute, otherwise in law, course of dealing, or usage of trade, including, without limitation, the implied or legal warranties and conditions of merchantability, merchantable quality, quality or fitness for a particular purpose, title, security, availability, reliability, accuracy, quiet enjoyment and non-infringement of third party rights. Without limiting the foregoing, we do not represent or warrant that the Portal or the Services (including any data relating thereto) will be uninterrupted, available at any particular time or error-free. Further, we do not warrant that errors in the Portal or the Service are correctable or will be correctable.
                  </Text>
                  <Text py={2}>
                    You acknowledge that your data on the Portal may become irretrievably lost or corrupted or temporarily unavailable due to a variety of causes, and agree that, to the maximum extent permitted under Applicable Law, we will not be liable for any loss or damage caused by denial-of-service attacks, software failures, viruses or other technologically harmful materials (including those which may infect your computer equipment), protocol changes by third party providers, Internet outages, force majeure events or other disasters, scheduled or unscheduled maintenance, or other causes either within or outside our control.
                  </Text>
                  <Text py={2}>
                    The disclaimer of implied warranties contained herein may not apply if and to the extent such warranties cannot be excluded or limited under the Applicable Law of the jurisdiction in which you reside.
                  </Text>
                </Box>

                <Box id={'exclusion-consequential-related-damages'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    10. EXCLUSION OF CONSEQUENTIAL AND RELATED DAMAGES
                  </Heading.h3>
                  <Text py={2}>
                    In no event shall we (together with our Affiliates, including our and our Affiliates’ respective shareholders, members, directors, officers, employees, attorneys, agents, representatives, suppliers or contractors) be liable for any incidental, indirect, special, punitive, consequential or similar damages or liabilities whatsoever (including, without limitation, damages for loss of data, information, revenue, goodwill, profits or other business or financial benefit) arising out of or in connection with the Portal and the Services (and any of their content and functionality), any execution or settlement of a transaction, any performance or non-performance of the Services, your Ether, Margin Tokens or any other product, service or other item provided by or on behalf of us, whether under contract, tort (including negligence), civil liability, statute, strict liability, breach of warranties, or under any other theory of liability, and whether or not we have been advised of, knew of or should have known of the possibility of such damages and notwithstanding any failure of the essential purpose of these Terms or any limited remedy hereunder nor is Idle in any way responsible for the execution or settlement of transactions between users of Idle open-source software.
                  </Text>
                </Box>

                <Box id={'exclusion-consequential-related-damages'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    11. LIMITATION OF LIABILITY
                  </Heading.h3>
                  <Text py={2}>
                    In no event shall our aggregate liability (together with our Affiliates, including our and our Affiliates’ respective shareholders, members, directors, officers, employees, attorneys, agents, representatives, suppliers or contractors) arising out of or in connection with the Portal and the Services (and any of their content and functionality), any performance or non-performance of the Services, your Ether, Margin Tokens or any other product, service or other item provided by or on behalf of us, whether under contract, tort (including negligence), civil liability, statute, strict liability or other theory of liability exceed the amount of fees paid by you to us under these Terms, if any, in the twelve (12) month period immediately preceding the event giving rise to the claim for liability.
                  </Text>
                </Box>

                <Box id={'dispute-resolution-arbitration'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    12. DISPUTE RESOLUTION AND ARBITRATION
                  </Heading.h3>
                  <Text py={2}>
                    Please read the following section carefully because it requires you to arbitrate certain disputes and claims with Idle and limits the manner in which you can seek relief from us, unless you opt out of arbitration by following the instructions set forth below. In addition, arbitration precludes you from suing in court or having a jury trial.
                    You and Idle agree that any dispute arising out of or related to these Terms or our Services is personal to you and Idle and that any dispute will be resolved solely through individual action, and will not be brought as a class arbitration, class action or any other type of representative proceeding.
                  </Text>
                  <Text py={2}>
                    Except for small claims disputes in which you or Idle seeks to bring an individual action in small claims court located in the county of your billing address or disputes in which you or Idle seeks injunctive or other equitable relief for the alleged unlawful use of intellectual property, you and Idle waive your rights to a jury trial and to have any dispute arising out of or related to these Terms or our Services resolved in court. Instead, for any dispute or claim that you have against Idle or relating in any way to the Services, you agree to first contact Idle and attempt to resolve the claim informally by sending a written notice of your claim (“Notice”) to Idle by email at info@idle.finance or by certified mail addressed to info@idle.finance. The Notice must (a) include your name, residence address, email address, and telephone number; (b) describe the nature and basis of the claim; (c) set forth the specific relief sought. Our notice to you will be similar in form to that described above. If you and Idle cannot reach an agreement to resolve the claim within thirty (30) days after such Notice is received, then either party may submit the dispute to binding arbitration administered by JAMS or, under the limited circumstances set forth above, in court. All disputes submitted to JAMS will be resolved through confidential, binding arbitration before one arbitrator. Arbitration proceedings will be held in New York City, New York, in accordance with the JAMS Streamlined Arbitration Rules and Procedures (“JAMS Rules”). The most recent version of the JAMS Rules are available on the JAMS website and are hereby incorporated by reference. You either acknowledge and agree that you have read and understand the JAMS Rules or waive your opportunity to read the JAMS Rules and waive any claim that the JAMS Rules are unfair or should not apply for any reason.
                  </Text>
                  <Text py={2}>
                    You and Idle agree that these Terms affect interstate commerce and that the enforceability of this Section 12 will be substantively and procedurally governed by the Federal Arbitration Act, 9 U.S.C. § 1, et seq. (the “FAA”), to the maximum extent permitted by applicable law. As limited by the FAA, these Terms and the JAMS Rules, the arbitrator will have exclusive authority to make all procedural and substantive decisions regarding any dispute and to grant any remedy that would otherwise be available in court, including the power to determine the question of arbitrability. The arbitrator may conduct only an individual arbitration and may not consolidate more than one individual’s claims, preside over any type of class or representative proceeding or preside over any proceeding involving more than one individual.
                  </Text>
                  <Text py={2}>
                    The arbitrator, Idle, and you will maintain the confidentiality of any arbitration proceedings, judgments and awards, including, but not limited to, all information gathered, prepared and presented for purposes of the arbitration or related to the dispute(s) therein. The arbitrator will have the authority to make appropriate rulings to safeguard confidentiality, unless the law provides to the contrary. The duty of confidentiality does not apply to the extent that disclosure is necessary to prepare for or conduct the arbitration hearing on the merits, in connection with a court application for a preliminary remedy or in connection with a judicial challenge to an arbitration award or its enforcement, or to the extent that disclosure is otherwise required by law or judicial decision.
                  </Text>
                  <Text py={2}>
                    You and Idle agree that for any arbitration you initiate, you will pay the filing fee and Idle will pay the remaining JAMS fees and costs. For any arbitration initiated by Idle, Idle will pay all JAMS fees and costs. You and Idle agree that the state or federal courts of the State of New York and the United States sitting in New York City, New York have exclusive jurisdiction over any appeals and the enforcement of an arbitration award.
                  </Text>
                  <Text py={2}>
                    Any claim arising out of or related to these Terms or our Services must be filed within one year after such claim arose; otherwise, the claim is permanently barred, which means that you and Idle will not have the right to assert the claim.
                  </Text>
                  <Text py={2}>
                    You have the right to opt out of binding arbitration within 30 days of the date you first accepted the terms of this Section 12 by emailing us at info@idle.finance. In order to be effective, the opt-out notice must include your full name and address and clearly indicate your intent to opt out of binding arbitration. By opting out of binding arbitration, you are agreeing to resolve disputes in accordance with Section 13.
                  </Text>
                  <Text py={2}>
                    If any portion of this Section 12 is found to be unenforceable or unlawful for any reason, (a) the unenforceable or unlawful provision shall be severed from these Terms; (b) severance of the unenforceable or unlawful provision shall have no impact whatsoever on the remainder of this Section 12 or the parties’ ability to compel arbitration of any remaining claims on an individual basis pursuant to this Section 12; and (c) to the extent that any claims must therefore proceed on a class, collective, consolidated, or representative basis, such claims must be litigated in a civil court of competent jurisdiction and not in arbitration, and the parties agree that litigation of those claims shall be stayed pending the outcome of any individual claims in arbitration. Further, if any part of this Section 12 is found to prohibit an individual claim seeking public injunctive relief, that provision will have no effect to the extent such relief is allowed to be sought out of arbitration, and the remainder of this Section 12 will be enforceable.
                  </Text>
                </Box>

                <Box id={'governing-law'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    13. GOVERNING LAW
                  </Heading.h3>
                  <Text py={2}>
                    The interpretation and enforcement of these Terms, and any dispute related to these Terms, the Portal or the Services, will be governed by and construed and enforced in accordance with the laws of the State of Delaware, as applicable, without regard to conflict of law rules or principles (whether of the State of Delaware or any other jurisdiction) that would cause the application of the laws of any other jurisdiction. You agree that we may initiate a proceeding related to the enforcement or validity of our intellectual property rights in any court having jurisdiction. With respect to any other proceeding that is not subject to arbitration under these Terms, the state and federal courts located in Wilmington, Delaware, will have exclusive jurisdiction. You waive any objection to venue in any such courts.
                  </Text>
                </Box>

                <Box id={'miscellaneous'} py={[2,3]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[3,4]}>
                    14. MISCELLANEOUS
                  </Heading.h3>
                  <Text py={2}>
                    Any right or remedy of Idle set forth in these Terms is in addition to, and not in lieu of, any other right or remedy whether described in these Terms, under Applicable Law, at law or in equity. Our failure or delay in exercising any right, power, or privilege under these Terms shall not operate as a waiver thereof. The invalidity or unenforceability of any of these Terms shall not affect the validity or enforceability of any other of these Terms, all of which shall remain in full force and effect. We will have no responsibility or liability for any failure or delay in performance of the Portal or any of the Services, or any loss or damage that you may incur, due to any circumstance or event beyond our control, including without limitation any flood, extraordinary weather conditions, earthquake, or other act of God, fire, war, insurrection, riot, labor dispute, accident, action of government, communications, power failure, or equipment or software malfunction. You may not assign or transfer any right to use the Portal or the Services, or any of your rights or obligations under these Terms, without our express prior written consent, including by operation of law or in connection with any change of control. We may assign or transfer any or all of our rights or obligations under these Terms, in whole or in part, without notice or obtaining your consent or approval. Headings of sections are for convenience only and shall not be used to limit or construe such sections. These Terms contain the entire agreement and supersede all prior and contemporaneous understandings between the parties regarding the Portal and the Services. In the event of any conflict between these Terms and any other agreement you may have with us, these Terms will control unless the other agreement specifically identifies these Terms and declares that the other agreement supersedes these Terms.
                  </Text>
                </Box>

              </Box>
            </Flex>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }
}

export default Tos;
