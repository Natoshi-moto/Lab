# Concentration / welfare tables (synthetic)

Evidence class: deterministic synthetic simulation. Not empirical.

| id | rule | eligible_sats | issued | remainder | top1_share_of_issued | gini | HHI |
|----|------|---------------|--------|-----------|----------------------|------|-----|
| 01_whale_50 | pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 02_whale_80 | pro_rata | 10000000 | 1000000000 | 0 | 0.800000 | 0.300000 | 0.680000 |
| 03_whale_99 | pro_rata | 10000000 | 1000000000 | 0 | 0.990000 | 0.490000 | 0.980200 |
| 04_exchange_omnibus_vs_small_donors | pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.490099 | 0.252500 |
| 05_sybil_split_concave | concave_sqrt | 20000 | 999999999 | 1 | 0.243902 | 0.152993 | 0.116657 |
| 06_sybil_split_control_pro_rata | pro_rata | 20000 | 1000000000 | 0 | 0.500000 | 0.409091 | 0.275000 |
| 07_rebate_sweep | pro_rata | 2000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 08_secret_rebate_whale | pro_rata | 10000000 | 1000000000 | 0 | 0.800000 | 0.300000 | 0.680000 |
| 09_denominator_doubles_final_block | pro_rata | 2000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 10_stolen_key_donation | pro_rata | 20000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 11_quantum_cutoff_freeze | pro_rata | 4000000 | 1000000000 | 0 | 0.750000 | 0.250000 | 0.625000 |
| 12_token_value_assumptions | pro_rata | 2000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 13_governance_proportional | pro_rata | 10000000 | 1000000000 | 0 | 0.600000 | 0.400000 | 0.420000 |
| 14_governance_capped | pro_rata | 10000000 | 1000000000 | 0 | 0.600000 | 0.400000 | 0.420000 |
| 15_lockup_0_months | pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 16_lockup_3_months | pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 17_lockup_12_months | pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 18_charity_set_single_vs_multi | pro_rata | 2000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 19_undersubscribed_pool | pro_rata | 1000 | 1000000000 | 0 | 1.000000 | 0.000000 | 1.000000 |
| 20_oversubscribed_pool | pro_rata | 20000000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |
| 21_no_token_baseline | no_token | 3000000 | 0 | 1000000000 | 0.000000 | 0.000000 | 0.000000 |
| 22_capped_pro_rata_whale | capped_pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.166667 | 0.375000 |
| 23_time_weighted_late_donor | time_weighted | 2000000 | 1000000000 | 0 | 0.750000 | 0.250000 | 0.625000 |
| 24_random_lottery_component | lottery_without_replacement | 10000 | 999999999 | 1 | 0.333333 | 0.250000 | 0.333333 |
| 25_concave_log_whale | concave_log | 1003000 | 999999997 | 3 | 0.413043 | 0.163043 | 0.285444 |
| 26_sybil_split_capped_pro_rata | capped_pro_rata | 20000 | 999999990 | 10 | 0.090909 | 0.000000 | 0.090909 |
| 27_laundering_opportunity_grid | pro_rata | 100000000 | 1000000000 | 0 | 0.900000 | 0.400000 | 0.820000 |
| 28_rebate_low_access_genesis_set | pro_rata | 10000000 | 1000000000 | 0 | 0.500000 | 0.000000 | 0.500000 |

Denominator note: `top1_share_of_issued` uses actually issued units, not the fixed pool.

