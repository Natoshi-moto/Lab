"""Defensive cost-scaling model for R011.

This module compares abstract cost hypotheses. It does not create, operate,
or provide instructions for fraudulent identities or platform evasion.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import exp
from typing import Iterable


@dataclass(frozen=True)
class CostParameters:
    fixed_cost: float = 0.0
    creation_weight: float = 1.0
    maintenance_weight: float = 1.0
    behaviour_weight: float = 1.0
    graph_weight: float = 1.0
    quality_weight: float = 1.0
    alpha_creation: float = 1.0
    alpha_maintenance: float = 1.0
    alpha_behaviour: float = 1.0
    alpha_graph: float = 1.0
    alpha_quality: float = 1.0
    correlated_loss_weight: float = 0.0
    correlation_rate: float = 0.0
    correlation_midpoint: float = 100.0
    threshold: int | None = None
    threshold_weight: float = 0.0
    threshold_exponent: float = 2.0

    def validate(self) -> None:
        numeric = (
            self.fixed_cost,
            self.creation_weight,
            self.maintenance_weight,
            self.behaviour_weight,
            self.graph_weight,
            self.quality_weight,
            self.alpha_creation,
            self.alpha_maintenance,
            self.alpha_behaviour,
            self.alpha_graph,
            self.alpha_quality,
            self.correlated_loss_weight,
            self.correlation_rate,
            self.correlation_midpoint,
            self.threshold_weight,
            self.threshold_exponent,
        )
        if any(value < 0 for value in numeric):
            raise ValueError("cost parameters must be non-negative")
        if self.correlation_midpoint <= 0:
            raise ValueError("correlation_midpoint must be positive")
        if self.threshold is not None and self.threshold < 1:
            raise ValueError("threshold must be at least 1")


def correlated_probability(n: int, rate: float, midpoint: float) -> float:
    """Bounded logistic proxy for shared-process correlation risk."""
    if n <= 0 or rate == 0:
        return 0.0
    x = rate * (n - midpoint) / midpoint
    return 1.0 / (1.0 + exp(-x))


def total_cost(n: int, params: CostParameters) -> float:
    """Return normalized total cost for a population of size ``n``."""
    if n < 0:
        raise ValueError("n must be non-negative")
    params.validate()
    if n == 0:
        return 0.0

    cost = params.fixed_cost
    components = (
        (params.creation_weight, params.alpha_creation),
        (params.maintenance_weight, params.alpha_maintenance),
        (params.behaviour_weight, params.alpha_behaviour),
        (params.graph_weight, params.alpha_graph),
        (params.quality_weight, params.alpha_quality),
    )
    cost += sum(weight * (n**alpha) for weight, alpha in components)

    probability = correlated_probability(
        n, params.correlation_rate, params.correlation_midpoint
    )
    cost += params.correlated_loss_weight * n * probability

    if params.threshold is not None and n > params.threshold:
        excess = n - params.threshold
        cost += params.threshold_weight * (excess**params.threshold_exponent)

    return cost


def marginal_cost(n: int, params: CostParameters) -> float:
    """Return the discrete cost of adding identity ``n`` to ``n - 1``."""
    if n < 1:
        raise ValueError("n must be at least 1")
    return total_cost(n, params) - total_cost(n - 1, params)


def average_cost(n: int, params: CostParameters) -> float:
    if n < 1:
        raise ValueError("n must be at least 1")
    return total_cost(n, params) / n


def cost_curve(counts: Iterable[int], params: CostParameters) -> list[dict[str, float]]:
    curve: list[dict[str, float]] = []
    for n in counts:
        if n < 1:
            raise ValueError("all counts must be at least 1")
        curve.append(
            {
                "n": float(n),
                "total": total_cost(n, params),
                "average": average_cost(n, params),
                "marginal": marginal_cost(n, params),
            }
        )
    return curve


def scenario(name: str) -> CostParameters:
    """Return transparent candidate scenarios, not empirical estimates."""
    scenarios = {
        "linear": CostParameters(),
        "sublinear": CostParameters(
            fixed_cost=20.0,
            alpha_creation=0.72,
            alpha_maintenance=0.88,
            alpha_behaviour=0.92,
            alpha_graph=0.95,
            alpha_quality=0.9,
        ),
        "superlinear": CostParameters(
            alpha_creation=1.0,
            alpha_maintenance=1.08,
            alpha_behaviour=1.24,
            alpha_graph=1.32,
            alpha_quality=1.18,
            correlated_loss_weight=2.0,
            correlation_rate=4.0,
            correlation_midpoint=100.0,
        ),
        "regime": CostParameters(
            fixed_cost=30.0,
            alpha_creation=0.75,
            alpha_maintenance=0.92,
            alpha_behaviour=1.02,
            alpha_graph=1.08,
            alpha_quality=1.0,
            correlated_loss_weight=1.5,
            correlation_rate=5.0,
            correlation_midpoint=120.0,
            threshold=100,
            threshold_weight=0.04,
            threshold_exponent=2.0,
        ),
    }
    try:
        return scenarios[name]
    except KeyError as exc:
        raise ValueError(f"unknown scenario: {name}") from exc
