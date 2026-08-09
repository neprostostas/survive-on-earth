import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";

export type CircleObstacle = { kind: "circle"; x: number; z: number; radius: number; label: string };
export type BoxObstacle = { kind: "box"; x: number; z: number; halfX: number; halfZ: number; label: string };
export type Obstacle = CircleObstacle | BoxObstacle;

export class CollisionWorld {
  readonly obstacles: Obstacle[] = [];

  addCircle(x: number, z: number, radius: number, label: string): void {
    this.obstacles.push({ kind: "circle", x, z, radius, label });
  }

  addBox(x: number, z: number, halfX: number, halfZ: number, label: string): void {
    this.obstacles.push({ kind: "box", x, z, halfX, halfZ, label });
  }

  remove(label: string): boolean {
    const index = this.obstacles.findIndex((obstacle) => obstacle.label === label);
    if (index < 0) return false;
    this.obstacles.splice(index, 1);
    return true;
  }

  updateCircle(label: string, x: number, z: number): boolean {
    const obstacle = this.obstacles.find((candidate): candidate is CircleObstacle => candidate.label === label && candidate.kind === "circle");
    if (!obstacle) return false;
    obstacle.x = x;
    obstacle.z = z;
    return true;
  }

  move(position: Vector3, displacement: Vector3, radius: number, ignoredLabel: string | null = null): Vector3 {
    const result = position.add(displacement);
    for (let pass = 0; pass < 3; pass += 1) {
      let corrected = false;
      for (const obstacle of this.obstacles) {
        if (obstacle.label === ignoredLabel) continue;
        const push = obstacle.kind === "circle"
          ? this.circlePush(result.x, result.z, radius, obstacle)
          : this.boxPush(result.x, result.z, radius, obstacle);
        if (push.lengthSquared() > 0) {
          result.x += push.x;
          result.z += push.y;
          corrected = true;
        }
      }
      if (!corrected) break;
    }
    return result;
  }

  private circlePush(x: number, z: number, radius: number, obstacle: CircleObstacle): Vector2 {
    const dx = x - obstacle.x;
    const dz = z - obstacle.z;
    const minDistance = radius + obstacle.radius;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= minDistance * minDistance) return Vector2.Zero();
    if (distanceSq < 0.000001) return new Vector2(minDistance, 0);
    const distance = Math.sqrt(distanceSq);
    return new Vector2(dx, dz).scale((minDistance - distance) / distance);
  }

  private boxPush(x: number, z: number, radius: number, obstacle: BoxObstacle): Vector2 {
    const closestX = Math.max(obstacle.x - obstacle.halfX, Math.min(x, obstacle.x + obstacle.halfX));
    const closestZ = Math.max(obstacle.z - obstacle.halfZ, Math.min(z, obstacle.z + obstacle.halfZ));
    const dx = x - closestX;
    const dz = z - closestZ;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= radius * radius) return Vector2.Zero();
    if (distanceSq > 0.000001) {
      const distance = Math.sqrt(distanceSq);
      return new Vector2(dx, dz).scale((radius - distance) / distance);
    }
    const left = Math.abs(x - (obstacle.x - obstacle.halfX));
    const right = Math.abs(obstacle.x + obstacle.halfX - x);
    const top = Math.abs(z - (obstacle.z - obstacle.halfZ));
    const bottom = Math.abs(obstacle.z + obstacle.halfZ - z);
    const min = Math.min(left, right, top, bottom);
    if (min === left) return new Vector2(-(left + radius), 0);
    if (min === right) return new Vector2(right + radius, 0);
    if (min === top) return new Vector2(0, -(top + radius));
    return new Vector2(0, bottom + radius);
  }
}
