# Restore

1. Obtain the Git bundle or clone the GitHub repository.
2. Verify its delivery SHA-256 sidecar.
3. Run `git bundle verify` when using a bundle.
4. Check out `main` and run `./nexus doctor`, the unit suite and `./nexus verify`.
5. Verify canonical snapshot sidecars before relying on any frozen target.

Restoring bytes does not certify the claims contained in them.
