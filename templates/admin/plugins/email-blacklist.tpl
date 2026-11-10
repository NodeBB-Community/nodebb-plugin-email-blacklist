<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
      <form role="form" class="email-blacklist-settings">
        <fieldset>
            <div class="mb-3">
                <label class="form-label" for="domains">Blacklisted domains</label>
                <textarea class="form-control" rows="6" id="domains" name="domains" placeholder="Enter email domains (one per line)"></textarea>
                <p class="form-text">Email addresses from these domains are rejected.</p>
            </div>

            <div class="mb-3">
                <label class="form-label" for="whitelist">Whitelisted domains</label>
                <textarea class="form-control" rows="6" id="whitelist" name="whitelist" placeholder="Enter email domains (one per line)"></textarea>
                <p class="form-text">If this list is not empty, only email addresses from these domains are accepted. The blacklist still applies.</p>
            </div>

            <div class="form-check form-switch mb-3">
                <input type="checkbox" class="form-check-input" id="matchSubdomains" name="matchSubdomains">
                <label class="form-check-label" for="matchSubdomains">Match subdomains</label>
                <p class="form-text">When enabled, an entry like <code>example.com</code> also matches <code>mail.example.com</code>, in both lists.</p>
            </div>
            <!-- <div class="checkbox"><label><input type="checkbox" id="isTempMailEnabled" name="isTempMailEnabled"/> Enable isTempMail API check</label></div> -->

        </fieldset>
      </form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
