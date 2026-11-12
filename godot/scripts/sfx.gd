# Sounds, made in code like the web version: no sound files to ship.
# beep() is a short blip; note() is the reedy raï accordion note used by the
# radio and Nemla Tiles. Each sound is built once and kept.
extends Node

const RATE := 22050
const VOICES := 8

# [wave, pitch ratio, detune in cents, level]: one reed in tune, two slightly
# off either side so the note shimmers, and a quiet one an octave down.
const REEDS := [["saw", 1.0, 0.0, 0.5], ["saw", 1.0, -8.0, 0.28], ["saw", 1.0, 8.0, 0.28], ["square", 0.5, 0.0, 0.12]]
# A short raï phrase for the radio, on a Hijaz scale.
const RADIO := [440.0, 466.2, 440.0, 392.0, 370.0, 392.0]

var _cache := {}
var _players: Array[AudioStreamPlayer] = []
var _next := 0
var muted := false


func _ready() -> void:
	for i in VOICES:
		var player := AudioStreamPlayer.new()
		add_child(player)
		_players.append(player)


func _play(stream: AudioStream, delay_ms := 0) -> void:
	if muted:
		return
	if delay_ms > 0:
		await get_tree().create_timer(delay_ms / 1000.0).timeout
	var player := _players[_next]
	_next = (_next + 1) % VOICES
	player.stream = stream
	player.play()


static func _wave(kind: String, phase: float) -> float:
	var p := fposmod(phase, 1.0)
	match kind:
		"square":
			return 1.0 if p < 0.5 else -1.0
		"triangle":
			return 4.0 * absf(p - 0.5) - 1.0
		"saw":
			return 2.0 * p - 1.0
		_:
			return sin(TAU * p)


static func _to_stream(samples: PackedFloat32Array) -> AudioStreamWAV:
	var data := PackedByteArray()
	data.resize(samples.size() * 2)
	for i in samples.size():
		data.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 32767.0))
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = RATE
	stream.stereo = false
	stream.data = data
	return stream


# A blip that fades out quickly, like the web version's beep().
func beep(freq: float, duration := 0.08, kind := "square", volume := 0.08, delay_ms := 0) -> void:
	var key := "b%s|%s|%s|%s" % [freq, duration, kind, volume]
	if not _cache.has(key):
		var n := int(duration * RATE)
		var samples := PackedFloat32Array()
		samples.resize(n)
		for i in n:
			var t := float(i) / RATE
			var gain := volume * pow(0.0001 / volume, t / duration)
			samples[i] = _wave(kind, freq * t) * gain * 2.5
		_cache[key] = _to_stream(samples)
	_play(_cache[key], delay_ms)


# A sung, reedy note: slides up into the pitch, then a slow vibrato comes in
# as it fades; a soft low-pass keeps it warm.
func note(freq: float, duration := 0.5, volume := 0.16, delay_ms := 0) -> void:
	var key := "n%s|%s|%s" % [freq, duration, volume]
	if not _cache.has(key):
		var n := int((duration + 0.05) * RATE)
		var samples := PackedFloat32Array()
		samples.resize(n)
		var phases := [0.0, 0.0, 0.0, 0.0]
		var low := 0.0
		for i in n:
			var t := float(i) / RATE
			var vibrato := sin(TAU * 5.5 * t) * freq * 0.006 * clampf(t / 0.2, 0.0, 1.0)
			var slide := lerpf(0.97, 1.0, clampf(t / 0.05, 0.0, 1.0))
			var sample := 0.0
			for r in REEDS.size():
				var reed: Array = REEDS[r]
				var f: float = (freq * slide + vibrato) * reed[1] * pow(2.0, reed[2] / 1200.0)
				phases[r] += f / RATE
				sample += _wave(reed[0], phases[r]) * reed[3]
			var cutoff := lerpf(3200.0, 1400.0, clampf(t / duration, 0.0, 1.0))
			low += (sample - low) * clampf(TAU * cutoff / RATE, 0.0, 1.0)
			var amp := volume * minf(1.0, t / 0.02)
			if t > 0.1:
				amp *= 0.7
			if t > duration - 0.18:
				amp *= clampf((duration - t) / 0.18, 0.0, 1.0)
			samples[i] = low * amp * 2.2
		_cache[key] = _to_stream(samples)
	_play(_cache[key], delay_ms)


func tap() -> void: beep(660, 0.05, "triangle", 0.06)
func no() -> void: beep(180, 0.15, "square", 0.05)
func eat() -> void:
	for i in 3: beep(240, 0.05, "square", 0.05, i * 110)
func wash() -> void:
	for i in 4: beep(700 + i * 150, 0.07, "sine", 0.06, i * 70)
func radio() -> void:
	for i in RADIO.size(): note(RADIO[i], 0.32, 0.12, i * 230)
func sleep() -> void:
	for i in 3: beep([392, 330, 262][i], 0.3, "sine", 0.05, i * 200)
func wake() -> void:
	for i in 3: beep([262, 330, 392][i], 0.15, "triangle", 0.06, i * 120)
func giggle() -> void:
	for i in 3: beep([880, 990, 1100][i], 0.06, "sine", 0.06, i * 70)
func level_up() -> void:
	for i in 4: beep([523, 659, 784, 1047][i], 0.14, "triangle", 0.07, i * 110)
func coins() -> void:
	for i in 3: beep([988, 1319, 1568][i], 0.09, "triangle", 0.07, i * 80)
func plant() -> void:
	for i in 2: beep(300 + i * 80, 0.08, "triangle", 0.06, i * 90)
func harvest() -> void:
	for i in 3: beep(620 + i * 210, 0.07, "sine", 0.07, i * 60)
func crop_ready() -> void:
	for i in 2: beep([784, 1047][i], 0.12, "sine", 0.05, i * 120)
