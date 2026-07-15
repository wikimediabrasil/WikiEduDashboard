# frozen_string_literal: true

class LabelsController < ApplicationController
  before_action :set_label, only: %i[show edit update destroy]
  before_action :require_admin_permissions, only: %i[create update destroy]

  def index
    @labels = Label.all
    if params[:match].present?
      @labels = @labels.where(match: params[:match].split(','))
    elsif params[:search].present?
      @labels = @labels.matching_query(params[:search])
    end
    respond_to do |format|
      format.html { render plain: @labels.to_json }
      format.json { render json: { labels: @labels } }
    end
  end

  def show
    respond_to do |format|
      format.html { render plain: @label.to_json }
      format.json { render json: @label }
    end
  end

  def new
    @label = Label.new
    render plain: 'New Label Form'
  end

  def create
    @label = Label.new(label_params)
    respond_to do |format|
      if @label.save
        format.html { redirect_to label_path(@label), notice: 'Label was successfully created.' }
        format.json { render json: @label, status: :created }
      else
        format.html {
 render plain: @label.errors.full_messages.join(', '), status: :unprocessable_entity }
        format.json { render json: @label.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    render plain: 'Edit Label Form'
  end

  def update
    respond_to do |format|
      if @label.update(label_params)
        format.html { redirect_to label_path(@label), notice: 'Label was successfully updated.' }
        format.json { render json: @label, status: :ok }
      else
        format.html {
 render plain: @label.errors.full_messages.join(', '), status: :unprocessable_entity }
        format.json { render json: @label.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @label.destroy
    respond_to do |format|
      format.html { redirect_to labels_path, notice: 'Label was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  def set_label
    @label = Label.find(params[:id])
  end

  def label_params
    params.require(:label).permit(:labels, :url, :match, :description, :display)
  end
end
