// ==UserScript==
// @name         Acronym Expander
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Expands common security/Kerberos related acronyms in text
// @author       Woprbot
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Dictionary of acronyms and their expansions
    const acronyms = {
        'AS-REQ': 'Authentication Service Request',
        'KDC': 'Key Distribution Centre',
        'DC': 'Domain Controller',
        'NTLM': 'New Technology LAN Manager',
        'TGT': 'Ticket Granting Ticket',
        'KRBTGT': 'Kerberos Ticket Granting Ticket',
        'TGS': 'Ticket Granting Service'
    };

    // Keep track of processed nodes
    const processedNodes = new WeakSet();

    // Function to escape special characters in string for regex
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Function to replace text with expansion
    function replaceAcronym(text) {
        let newText = text;
        for (const [acronym, expansion] of Object.entries(acronyms)) {
            // Create a regex that matches the acronym with word boundaries
            const regex = new RegExp(`\\b${escapeRegExp(acronym)}\\b`, 'g');
            newText = newText.replace(regex, `|||${acronym} (${expansion})|||`);
        }
        return newText;
    }

    // Function to process text nodes
    function processNode(node) {
        // Skip if already processed
        if (processedNodes.has(node)) {
            return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const originalText = node.textContent;
            const newText = replaceAcronym(originalText);

            if (originalText !== newText && newText.includes('|||')) {
                const container = document.createElement('span');
                const parts = newText.split('|||');

                parts.forEach((part, index) => {
                    if (index % 2 === 0) {
                        // Regular text
                        if (part) {
                            container.appendChild(document.createTextNode(part));
                        }
                    } else {
                        // Acronym and expansion
                        const styledSpan = document.createElement('span');
                        styledSpan.style.color = 'purple';
                        styledSpan.style.fontWeight = 'bold';
                        styledSpan.textContent = part;
                        container.appendChild(styledSpan);
                    }
                });

                node.parentNode.replaceChild(container, node);
                processedNodes.add(container);
            }
        } else {
            // Skip script and style elements
            if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
                return;
            }
            // Process child nodes
            for (const child of node.childNodes) {
                processNode(child);
            }
        }
    }

    // Function to handle dynamic content changes
    function observeChanges() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && !processedNodes.has(node)) {
                        processNode(node);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initial processing
    setTimeout(() => {
        processNode(document.body);
        // Start observing for dynamic changes
        observeChanges();
    }, 1000);
})();