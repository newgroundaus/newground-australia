/* Sends Get Involved and prayer requests through EmailJS.
   Prayer uses the Prayer template. Get Involved uses the Contact Us template.
   Both templates read name, email, reply_to, subject, message, and the
   labelled fields below. Values are escaped because the template is HTML. */
(function (global) {
    var ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

    function setting(name) {
        var config = global.NGA_CONFIG || {};
        return String(config[name] || "").trim();
    }

    function htmlText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
    }

    function templateIdFor(fields) {
        if (fields._form === "prayer") {
            return setting("emailjsPrayerTemplateId") || setting("emailjsTemplateId");
        }
        if (fields._form === "contact") {
            return setting("emailjsContactTemplateId") || setting("emailjsTemplateId");
        }
        return setting("emailjsTemplateId");
    }

    global.NGA_sendForm = function (fields) {
        var publicKey = setting("emailjsPublicKey");
        var serviceId = setting("emailjsServiceId");
        var templateId = templateIdFor(fields);
        if (!publicKey || !serviceId || !templateId) {
            return Promise.resolve({ ok: false, message: "EmailJS is not configured." });
        }

        var replyTo = fields._replyto || fields.email || "";
        var payload = {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
                name: fields.name || "",
                email: replyTo,
                reply_to: replyTo,
                subject: fields._subject || "New Ground Australia",
                message: htmlText(fields.message),
                phone: htmlText(fields.phone),
                role: htmlText(fields.role),
                help: htmlText(fields.help),
                org: htmlText(fields.org),
                place: htmlText(fields.place),
                state: htmlText(fields.state)
            }
        };

        return fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }).then(function (response) {
            return response.text().then(function (text) {
                var detail = String(text || "").replace(/^"|"$/g, "").trim();
                return {
                    ok: response.ok && detail === "OK",
                    message: response.ok ? "" : detail
                };
            });
        }).catch(function () {
            return { ok: false, message: "" };
        });
    };
})(window);
