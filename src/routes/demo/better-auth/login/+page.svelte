<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>Login</h1>
<form method="post" action="?/signInSocial" use:enhance>
	<input type="hidden" name="provider" value="github" />
	<input type="hidden" name="callbackURL" value="/demo/better-auth" />
	<button class="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
		>Sign in with GitHub</button
	>
</form>
