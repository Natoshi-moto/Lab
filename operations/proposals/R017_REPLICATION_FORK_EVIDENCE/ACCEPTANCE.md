# R017 acceptance gates

The proposal is review-ready only if all gates pass from exact repository bytes:

1. The campaign generator reproduces both fixture files byte-for-byte.
2. Python/OpenSSL and Node/Noble emit the exact saved R017 report.
3. The two closed branches share exact genesis and common-event bytes, contain
   distinct siblings of one predecessor, and independently replay through the
   Node/Noble R016 verifier.
4. All three checkpoint signatures and complete protocol bindings verify.
5. Sender, session, profile, genesis, payload, signature, sibling-digest, and
   lookalike-genesis mutations fail before producing a passing report.
6. Reordered children and checkpoint observations yield byte-identical fork
   evidence with `branch_selection: NONE`.
7. The complete repository unit-test suite, `nexus doctor`, and `nexus verify`
   pass in the declared environment.

A pass supports only the bounded claim matrix. Promotion remains a separate
human-authorized state transition.
