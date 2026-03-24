// Import company logos from separate JavaScript files
const COMPANY_LOGOS = {};

// Function to create and append script elements
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load all logo scripts when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load the logo scripts first, then initialize the application
    Promise.all([
        loadScript('../vars/indiana-logo.js'),
        loadScript('../vars/ohio-logo.js'),
        loadScript('../vars/national-logo.js')
    ]).then(() => {
        // Assign the loaded logos to COMPANY_LOGOS
        if (typeof INDIANA_LOGO !== 'undefined') COMPANY_LOGOS.indiana = INDIANA_LOGO;
        if (typeof OHIO_LOGO !== 'undefined') COMPANY_LOGOS.ohio = OHIO_LOGO;
        if (typeof NATIONAL_LOGO !== 'undefined') COMPANY_LOGOS.national = NATIONAL_LOGO;
        
        console.log("Logos loaded successfully:", COMPANY_LOGOS);
        
        // Initialize application
        initTabs();
        initFormEvents();
        loadSavedSignatures();
        
        // Update signature preview
        updateSignaturePreview();
    }).catch(err => {
        console.error('Error loading logo scripts:', err);
    });
});

// Default disclaimer text
const DEFAULT_DISCLAIMER = "The content of this email is confidential; this email is intended only for the recipient specified in this email. It is strictly forbidden to share any part of this email with any third party without the written consent of the sender. If you received this email by mistake, please reply to this message and follow with its deletion, so that we can ensure that such a mistake does not occur in the future. Thank you for your cooperation!";

// Company-specific information
const COMPANY_INFO = {
    indiana: {
        name: "Indiana Car Wash Holdings LLC",
        website: "https://www.ohiocwh.com",
        secondWebsite: "",
        color: "#FF5500",
        email: "yourmail@ohiocwh.com"
    },
    ohio: {
        name: "Ohio Car Wash Holdings LLC",
        website: "https://www.ohiocwh.com",
        secondWebsite: "",
        color: "#FF5500",
        email: "yourmail@ohiocwh.com"
    },
    national: {
        name: "NPE Enterprise, LLC",
        website: "https://www.carwashsuperstore.com",
        secondWebsite: "https://www.nationalprideequip.com",
        color: "#0078D7",
        email: "myemail@nationalpridecarwash.com"
    }
};

// This event listener has been moved to the top of the file

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and content
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // If switching to saved signatures tab, refresh the list
            if (tabId === 'saved') {
                loadSavedSignatures();
            }
        });
    });
}

function initFormEvents() {
    // Form input change listeners for live preview
    document.querySelectorAll('#build-tab input').forEach(input => {
        input.addEventListener('input', updateSignaturePreview);
        
        // For checkbox inputs, also listen for change events
        if (input.type === 'checkbox') {
            input.addEventListener('change', updateSignaturePreview);
        }
    });
    
    // Company selection change
    document.getElementById('company-dropdown').addEventListener('change', updateSignaturePreview);
    
    // Initialize company buttons
    const companyButtons = document.querySelectorAll('.company-btn');
    const companyDropdown = document.getElementById('company-dropdown');
    
    // Set the Indiana button as active by default
    document.getElementById('indiana-btn').classList.add('active');
    
    companyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            companyButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set the hidden dropdown value based on button ID
            const companyValue = this.id.replace('-btn', '');
            companyDropdown.value = companyValue;
            
            // Trigger change event on dropdown to update the preview
            companyDropdown.dispatchEvent(new Event('change'));
        });
    });
    
    // Default office phone value
    const officePhoneInput = document.getElementById('office-phone');
    if (officePhoneInput.value === '') {
        officePhoneInput.value = '(419) 567-6133';
    }
    
    // Make sure the address field has a default value
    const addressInput = document.getElementById('address');
    if (addressInput.value === '') {
        addressInput.value = '905 Hickory Ln, Mansfield, OH 44905';
    }
    
    // Save button
    document.getElementById('save-signature').addEventListener('click', saveSignature);
    
    // Copy button
    document.getElementById('copy-signature').addEventListener('click', copySignatureToClipboard);
    
    // Reset form button
    document.getElementById('reset-form').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
            // Clear all input fields except for office phone and address which have defaults
            document.getElementById('name').value = '';
            document.getElementById('title').value = '';
            document.getElementById('cell-phone').value = '';
            document.getElementById('extension').value = '';
            document.getElementById('email').value = '';
            
            // Reset checkboxes
            document.getElementById('include-cell').checked = false;
            document.getElementById('include-disclaimer').checked = true;
            
            // Reset to Indiana company by default
            document.getElementById('company-dropdown').value = 'indiana';
            
            // Update company buttons
            const companyButtons = document.querySelectorAll('.company-btn');
            companyButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('indiana-btn').classList.add('active');
            
            // Update the preview
            updateSignaturePreview();
        }
    });
    
    // Clear stored signatures button (for debugging)
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn danger';
    clearBtn.style.marginTop = '20px';
    clearBtn.textContent = 'Clear All Saved Signatures';
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all saved signatures?')) {
            localStorage.removeItem('emailSignatures');
            alert('All signatures have been cleared!');
            loadSavedSignatures();
        }
    });
    
    // Add clear button to the form
    const signatureForm = document.querySelector('#build-tab form');
    if (signatureForm) {
        signatureForm.appendChild(clearBtn);
    }
}

function updateSignaturePreview() {
    const preview = document.getElementById('signature-preview');
    const signatureHtml = generateSignatureHtml();
    
    if (signatureHtml) {
        preview.innerHTML = signatureHtml;
        
        // Initialize tooltips if they exist
        const tooltips = document.querySelectorAll('.help-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('mouseover', function() {
                const title = this.getAttribute('title');
                this.setAttribute('data-title', title);
                this.removeAttribute('title');
                
                const tooltipEl = document.createElement('div');
                tooltipEl.className = 'tooltip-text';
                tooltipEl.textContent = title;
                tooltipEl.style.position = 'absolute';
                tooltipEl.style.backgroundColor = '#333';
                tooltipEl.style.color = 'white';
                tooltipEl.style.padding = '5px 10px';
                tooltipEl.style.borderRadius = '4px';
                tooltipEl.style.fontSize = '12px';
                tooltipEl.style.zIndex = '100';
                tooltipEl.style.opacity = '0';
                tooltipEl.style.transition = 'opacity 0.3s';
                document.body.appendChild(tooltipEl);
                
                const rect = this.getBoundingClientRect();
                tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10 + window.scrollY}px`;
                tooltipEl.style.left = `${rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2) + window.scrollX}px`;
                setTimeout(() => tooltipEl.style.opacity = '1', 10);
                
                this.tooltipElement = tooltipEl;
            });
            
            tooltip.addEventListener('mouseout', function() {
                if (this.tooltipElement) {
                    document.body.removeChild(this.tooltipElement);
                    this.tooltipElement = null;
                }
                
                const title = this.getAttribute('data-title');
                if (title) {
                    this.setAttribute('title', title);
                    this.removeAttribute('data-title');
                }
            });
        });
    } else {
        preview.innerHTML = '<div class="signature-loading">Fill in the required fields to preview your signature</div>';
    }
}

function generateSignatureHtml() {
    // Get form values
    const name = document.getElementById('name').value.trim();
    const title = document.getElementById('title').value.trim();
    // Get the static address and check if it should be included
    const address = document.getElementById('address').value.trim();
    const includeAddress = document.getElementById('include-address').checked;
    const includeCell = document.getElementById('include-cell').checked;
    const cellPhone = includeCell ? document.getElementById('cell-phone').value.trim() : '';
    const officePhone = document.getElementById('office-phone').value.trim() || '(419) 567-6133';
    const extension = document.getElementById('extension').value.trim();
    const email = document.getElementById('email').value.trim();
    const includeDisclaimer = document.getElementById('include-disclaimer').checked;
    
    // Get selected company
    const company = document.getElementById('company-dropdown').value;
    
    // Check required fields
    if (!name || !title) {
        return null;
    }
    
    // Generate HTML with company-specific styles
    let borderColor = COMPANY_INFO[company].color;
    
    // Check if Apple Outlook mode is enabled
    const isAppleMode = document.getElementById('apple-outlook') && document.getElementById('apple-outlook').checked;
    
    let html;
    
    if (isAppleMode) {
        // APPLE VERSION: Much simpler layout
        
        html = `
        <div style="background-color: transparent !important;">
            <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; border-collapse: collapse; background-color: transparent !important;">
                <tr style="background-color: transparent !important;">
                    <td style="vertical-align: middle; padding: 0 ${company === 'indiana' ? '8px' : '16px'} 0 0; text-align: center; background-color: transparent !important;">
                        <img src="${COMPANY_LOGOS[company]}" alt="${COMPANY_INFO[company].name} Logo" style="max-width: ${company === 'national' ? '120px' : '110px'}; max-height: ${company === 'national' ? '100px' : '110px'}; display: inline-block; background-color: transparent !important;">
                    </td>
                    <td style="vertical-align: middle; padding-left: 16px; padding-right: 0; background-color: transparent !important; border-left: 4px solid ${borderColor};">
                        <div style="font-weight: bold; font-size: 18px; color: ${borderColor}; margin-bottom: 2px; background-color: transparent !important;">${name}</div>
                        <div style="font-size: 14px; color: #333333; margin-bottom: 6px; background-color: transparent !important;">${title}</div>
                        <div style="font-size: 13px; margin-bottom: 2px; background-color: transparent !important;">${COMPANY_INFO[company].name}</div>
                        ${includeAddress ? `<div style="font-size: 12px; margin-bottom: 2px; background-color: transparent !important;">${address}</div>` : ""}
    `;
    } else {
        // WINDOWS VERSION: Original design with colored bar cell
        const logoHeight = company === 'national' ? "220px" : "180px";
        
        html = `
        <div style="background-color: transparent !important;">
            <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; border-collapse: collapse; background-color: transparent !important;">
                <tr style="background-color: transparent !important;">
                    <td style="vertical-align: middle; padding: 0 ${company === 'indiana' ? '8px' : '16px'} 0 0; width: 150px; text-align: center; background-color: transparent !important;">
                        <img src="${COMPANY_LOGOS[company]}" alt="${COMPANY_INFO[company].name} Logo" style="max-width: ${company === 'national' ? '120px' : '110px'}; max-height: ${company === 'national' ? '100px' : '110px'}; display: inline-block; background-color: transparent !important;">
                    </td>
                    <td style="width: 4px; padding: 0; background-color: ${borderColor} !important; vertical-align: middle;"></td>
                    <td style="vertical-align: middle; padding-left: 16px; padding-right: 0; background-color: transparent !important;">
                        <div style="font-weight: bold; font-size: 18px; color: ${borderColor}; margin-bottom: 2px; background-color: transparent !important;">${name}</div>
                        <div style="font-size: 14px; color: #333333; margin-bottom: 6px; background-color: transparent !important;">${title}</div>
                        <div style="font-size: 13px; margin-bottom: 2px; background-color: transparent !important;">${COMPANY_INFO[company].name}</div>
                        ${includeAddress ? `<div style="font-size: 12px; margin-bottom: 2px; background-color: transparent !important;">${address}</div>` : ""}
    `;
    }
    
    // Office phone is always included
    html += `<div style="font-size: 12px; margin-bottom: 2px; background-color: transparent !important;">Office: <a href="tel:${officePhone.replace(/[^\d]/g, '')}" style="color: #333333; text-decoration: none; background-color: transparent !important;">${officePhone}</a>${extension ? ' ext. ' + extension : ''}</div>`;
    
    if (includeCell && cellPhone) {
        html += `<div style="font-size: 12px; margin-bottom: 2px; background-color: transparent !important;">Cell: <a href="tel:${cellPhone.replace(/[^\d]/g, '')}" style="color: #333333; text-decoration: none; background-color: transparent !important;">${cellPhone}</a></div>`;
    }
    
    // Use company-specific email domain or user provided email
    const displayEmail = email || COMPANY_INFO[company].email;
    html += `<div style="font-size: 12px; margin-bottom: 2px; background-color: transparent !important;">Email: <a href="mailto:${displayEmail}" style="color: ${borderColor}; text-decoration: none; background-color: transparent !important;">${displayEmail}</a></div>`;
    
    // Add websites only for National Pride
    if (company === 'national') {
        html += `
            <div style="font-size: 12px; margin-bottom: 2px; background-color: transparent !important;">
                <a href="${COMPANY_INFO[company].website}" style="color: ${borderColor}; text-decoration: none; background-color: transparent !important;">carwashsuperstore.com</a><br>
                <a href="${COMPANY_INFO[company].secondWebsite}" style="color: #ee3d3a; text-decoration: none; background-color: transparent !important;">nationalprideequip.com</a>
            </div>
        `;
    }
    
    html += `
                </td>
            </tr>
        </table>
    `;
    
    if (includeDisclaimer) {
        html += ``
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; max-width: 600px; background-color: transparent !important;">
            <tr style="background-color: transparent !important;">
                <td style="font-size: 10px; color: #666666; font-style: normal; margin-top: 10px; padding-top: 10px; background-color: transparent !important;">
                    ${DEFAULT_DISCLAIMER}
                </td>
            </tr>
        </table>``;
    }
    
    html += `</div>`;
    
    return html;
}

function saveSignature() {
    // Get form values
    const name = document.getElementById('name').value.trim();
    const title = document.getElementById('title').value.trim();
    const company = document.getElementById('company-dropdown').value;
    
    // Check required fields
    if (!name || !title) {
        alert('Please enter your name and title before saving.');
        return;
    }
    
    // Generate HTML for signature
    const signatureHtml = generateSignatureHtml();
    
    if (!signatureHtml) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Create signature object
    const signatureData = {
        id: Date.now().toString(),
        name,
        title,
        company,
        html: signatureHtml,
        createdAt: new Date().toISOString(),
        // Save additional form fields for editing
        address: document.getElementById('address').value.trim(),
        includeAddress: document.getElementById('include-address').checked,
        cellPhone: document.getElementById('cell-phone').value.trim(),
        includeCell: document.getElementById('include-cell').checked,
        officePhone: document.getElementById('office-phone').value.trim(),
        extension: document.getElementById('extension').value.trim(),
        email: document.getElementById('email').value.trim(),
        includeDisclaimer: document.getElementById('include-disclaimer').checked,
        // Save Apple Outlook compatibility mode
        appleMode: document.getElementById('apple-outlook') ? document.getElementById('apple-outlook').checked : false
    };
    
    // Get existing signatures from local storage
    let signatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    
    // Add new signature
    signatures.push(signatureData);
    
    // Save to local storage
    localStorage.setItem('emailSignatures', JSON.stringify(signatures));
    
    // Show success message
    alert('Signature saved successfully!');
    
    // Switch to Saved Signatures tab
    document.querySelector('.tab-btn[data-tab="saved"]').click();
}

function loadSavedSignatures() {
    const container = document.getElementById('saved-signatures');
    const signatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    
    if (signatures.length === 0) {
        container.innerHTML = '<p class="empty-state">No saved signatures yet. Create one in the Build Signature tab.</p>';
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Add each signature
    signatures.forEach(signature => {
        const signatureElement = document.createElement('div');
        signatureElement.className = 'saved-signature';
        signatureElement.innerHTML = `
            <div class="saved-signature-header">
                <div class="saved-signature-title">${signature.name} - ${signature.title} (${COMPANY_INFO[signature.company].name})</div>
                <div class="saved-signature-actions">
                    <button class="btn secondary edit-signature" data-id="${signature.id}">Edit</button>
                    <button class="btn primary copy-signature" data-id="${signature.id}">Copy</button>
                    <button class="btn danger delete-signature" data-id="${signature.id}">Delete</button>
                </div>
            </div>
            <div>
                ${signature.html}
            </div>
        `;
        
        container.appendChild(signatureElement);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-signature').forEach(button => {
        button.addEventListener('click', function() {
            editSignature(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.copy-signature').forEach(button => {
        button.addEventListener('click', function() {
            copySavedSignature(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-signature').forEach(button => {
        button.addEventListener('click', function() {
            deleteSignature(this.getAttribute('data-id'));
        });
    });
}

function editSignature(id) {
    // Get signatures from local storage
    const signatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    const signature = signatures.find(sig => sig.id === id);
    
    if (!signature) {
        alert('Signature not found.');
        return;
    }
    
    // Switch to Build tab
    document.querySelector('.tab-btn[data-tab="build"]').click();
    
    // Fill form with signature data
    document.getElementById('name').value = signature.name;
    document.getElementById('title').value = signature.title;
    document.getElementById('company-dropdown').value = signature.company;
    document.getElementById('address').value = signature.address || '';
    document.getElementById('include-address').checked = signature.includeAddress;
    document.getElementById('cell-phone').value = signature.cellPhone || '';
    document.getElementById('include-cell').checked = signature.includeCell;
    document.getElementById('office-phone').value = signature.officePhone;
    document.getElementById('extension').value = signature.extension;
    document.getElementById('email').value = signature.email;
    document.getElementById('include-disclaimer').checked = signature.includeDisclaimer;
    
    // Restore Apple Outlook compatibility mode if it exists
    if (document.getElementById('apple-outlook') && signature.hasOwnProperty('appleMode')) {
        document.getElementById('apple-outlook').checked = signature.appleMode;
    }
    
    // Update company buttons
    const companyButtons = document.querySelectorAll('.company-btn');
    companyButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${signature.company}-btn`).classList.add('active');
    
    // Update preview
    updateSignaturePreview();
    
    // Delete the old signature
    deleteSignature(id, true);
}

function copySavedSignature(id) {
    // Get signatures from local storage
    const signatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    const signature = signatures.find(sig => sig.id === id);
    
    if (!signature) {
        alert('Signature not found.');
        return;
    }
    
    // Create a temporary container to hold the rendered HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = signature.html;
    document.body.appendChild(tempContainer);
    
    // Select the rendered HTML content
    const range = document.createRange();
    range.selectNodeContents(tempContainer);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
        // Execute copy command on the rendered HTML
        const successful = document.execCommand('copy');
        if (successful) {
            alert('Signature copied to clipboard! You can now paste it directly into Outlook.');
        } else {
            alert('Failed to copy signature. Try selecting the signature and using Ctrl+C instead.');
        }
    } catch (err) {
        alert('Failed to copy signature: ' + err);
    }
    
    // Clean up
    selection.removeAllRanges();
    document.body.removeChild(tempContainer);
}

function copySignatureToClipboard() {
    const signatureHtml = generateSignatureHtml();
    
    if (!signatureHtml) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Create a temporary container to hold the rendered HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = signatureHtml;
    document.body.appendChild(tempContainer);
    
    // Select the rendered HTML content
    const range = document.createRange();
    range.selectNodeContents(tempContainer);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
        // Execute copy command on the rendered HTML
        const successful = document.execCommand('copy');
        if (successful) {
            alert('Signature copied to clipboard! You can now paste it directly into Outlook.');
        } else {
            alert('Failed to copy signature. Try selecting the signature and using Ctrl+C instead.');
        }
    } catch (err) {
        alert('Failed to copy signature: ' + err);
    }
    
    // Clean up
    selection.removeAllRanges();
    document.body.removeChild(tempContainer);
}

function deleteSignature(id, skipConfirmation = false) {
    if (!skipConfirmation && !confirm('Are you sure you want to delete this signature?')) {
        return;
    }
    
    // Get signatures from local storage
    let signatures = JSON.parse(localStorage.getItem('emailSignatures') || '[]');
    
    // Remove signature with matching ID
    signatures = signatures.filter(sig => sig.id !== id);
    
    // Save back to local storage
    localStorage.setItem('emailSignatures', JSON.stringify(signatures));
    
    // If not skipping confirmation (i.e., not editing), reload the list
    if (!skipConfirmation) {
        loadSavedSignatures();
    }
}


