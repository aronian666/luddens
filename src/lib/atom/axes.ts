import { BufferGeometry, Line, LineBasicMaterial, type Quaternion, Vector3 } from 'three';

type Axis = 'x' | 'y' | 'z';
type AxisView = Axis | `-${Axis}`;
export type CameraView = 'default' | AxisView;
export type AxisHandle = {
	view: AxisView;
	label: string;
	color: string;
	positive: boolean;
	x: number;
	y: number;
	depth: number;
	angle: number;
	length: number;
};

const directions = [
	{ axis: 'x', vector: new Vector3(1, 0, 0), color: '#f48e9e' },
	{ axis: 'y', vector: new Vector3(0, 1, 0), color: '#9bdc84' },
	{ axis: 'z', vector: new Vector3(0, 0, 1), color: '#8cbbff' }
] as const;

export function axisDirection(view: AxisView) {
	const axis = view.charAt(view.length - 1);
	const sign = view.startsWith('-') ? -1 : 1;
	return directions.find(direction => direction.axis === axis)!.vector.clone().multiplyScalar(sign);
}

export function createSceneAxes(length = 3.15) {
	return directions.map(({ vector, color }) => {
		const end = vector.clone().multiplyScalar(length);
		const line = new Line(
			new BufferGeometry().setFromPoints([end.clone().negate(), end]),
			new LineBasicMaterial({ color, transparent: true, opacity: 0.4, depthWrite: false })
		);
		line.renderOrder = 8;
		return line;
	});
}

export function projectAxisHandles(rotation: Quaternion): AxisHandle[] {
	return directions.flatMap(({ axis, vector, color }) => {
		const projected = vector.clone().applyQuaternion(rotation);
		const overlap = 13 * Math.max(0, 1 - Math.hypot(projected.x, projected.y) / 0.3);
		return ([1, -1] as const).map(sign => {
			const x = sign * (projected.x * 39 + overlap);
			const y = sign * -projected.y * 39;
			return {
				view: sign === 1 ? axis : `-${axis}`,
				label: axis.toUpperCase(),
				color,
				positive: sign === 1,
				x,
				y,
				depth: Math.round((1 + projected.z * sign) * 10) + 2,
				angle: Math.atan2(y, x),
				length: Math.hypot(x, y)
			};
		});
	});
}
